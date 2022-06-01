import {AsyncFunction, IScriptCommsHandler, Payload, SyncFunction} from "./types";
import {Realm, Realms} from "./realms";
import {callbackToPromise, wrapMessage} from "./helpers";


abstract class ScriptCommsHandler implements IScriptCommsHandler {

	protected linkedMethods:Record<string, AsyncFunction> = {};
	private eventListeners:Record<string, SyncFunction[]> = {};
	private hasTapped:boolean = false;
	private listener:any = undefined;

	protected constructor(protected readonly realm:Realm) {}

	protected payloadIsValid(payload:Payload<any>){
		if (!payload.$$excom) return false;
		if (payload.$$realms?.destination !== this.realm) return false;
		return !!payload.$$message;
	}

	private handlePayload(payload:Payload<any>, sender:chrome.runtime.MessageSender, sendResponse:(response?:any)=>void){
		if (this.payloadIsValid(payload)){
			if (!!payload.$$message.excomAction){
				const method = this.methods[payload.$$message.excomAction.name];
				if (!method){
					sendResponse([false, 'Method does not exist']);
					return;
				}
				method.call(this, ...payload.$$message.excomAction.args).then(resp => {
					sendResponse([true, resp]);
				});
				return true;
			}
		}
		this.dispatchEvent('message', payload.$$message);
		sendResponse([true, null]);
	}

	tap(){
		if (this.hasTapped) return this;
		this.listener = this.handlePayload.bind(this);
		chrome.runtime.onMessage.addListener(this.listener);
		this.hasTapped = true;
		return this;
	}

	untap(){
		if (!this.hasTapped) return this;
		chrome.runtime.onMessage.removeListener(this.listener);
		this.hasTapped = false;
		return this;
	}

	registerInterfaces(interfaces: Record<string, AsyncFunction<any,any>>) {
		this.linkedMethods = {
			...this.linkedMethods,
			...interfaces
		};
		return this;
	}

	get methods(){
		return this.linkedMethods;
	}

	dispatchEvent(eventType:string, details?:any) {
		this.eventListeners[eventType]?.forEach(listener => listener.call(this, details));
		return this;
	}

	addListener(eventType:string, callback:(details?:any)=>void){
		this.eventListeners[eventType] = this.eventListeners[eventType] ?? [];
		this.eventListeners[eventType].push(callback);
		return this;
	}

	removeListener(eventType:string, callback?:(details?:any)=>void){
		if (!callback) this.eventListeners[eventType] = [];
		else {
			this.eventListeners[eventType] = this.eventListeners[eventType]?.filter(listener => listener !== callback) ?? [];
		}
		return this;
	}

}

class ContentScriptCommsHandler extends ScriptCommsHandler {
	public readonly backgroundMethods:Record<string, any>;
	public readonly popupMethods:Record<string, any>;

	constructor() {
		super(Realms.CONTENT);

		this.backgroundMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToBackground({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});

		this.popupMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToPopup({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});
	}

	async emitToBackground<T=any>(message:T){
		return callbackToPromise(chrome.runtime.sendMessage, wrapMessage(message, {originRealm:this.realm, destinationRealm: Realms.BACKGROUND}));
	}

	async emitToPopup<T=any,R=any>(message:T){
		return callbackToPromise<R>(chrome.runtime.sendMessage, wrapMessage(message, {originRealm:this.realm, destinationRealm: Realms.POPUP}));
	}

}

class BackgroundScriptCommsHandler extends ScriptCommsHandler {
	public readonly contentMethods:Record<string, any>;
	public readonly popupMethods:Record<string, any>;

	constructor() {
		super(Realms.BACKGROUND);

		this.contentMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToContent({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});

		this.popupMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToPopup({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});
	}

	async emitToContent<T=any,R=any>(message:T){
		return new Promise<R>((resolve, reject) => {
			chrome.tabs.query({active: true, currentWindow: true}, tabs => {
				if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id!, wrapMessage(message, {originRealm:this.realm, destinationRealm:Realms.CONTENT}));
				else reject('No tabs found');
			})
		});
	}

	async emitToPopup<T=any,R=any>(message:T){
		return callbackToPromise<R>(chrome.runtime.sendMessage, wrapMessage(message, {originRealm:this.realm, destinationRealm: Realms.POPUP}));
	}

}

class PopupScriptCommsHandler extends ScriptCommsHandler {
	public readonly contentMethods:Record<string, any>;
	public readonly backgroundMethods:Record<string, any>;

	constructor() {
		super(Realms.POPUP);

		this.contentMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToContent({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});

		this.backgroundMethods = new Proxy({}, {
			get: (_, methodName:string) => {
				return async (...params:any[]) => {
					let result = await this.emitToBackground({
						excomAction: { name: methodName, args:params }
					});
					let [succeeded, response] = result;
					if (!succeeded) throw new Error(response);
					return response;
				}
			}
		});
	}

	async emitToContent<T=any,R=any>(message:T){
		return new Promise<R>((resolve, reject) => {
			chrome.tabs.query({active: true, currentWindow: true}, tabs => {
				if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id!, wrapMessage(message, {originRealm:this.realm, destinationRealm:Realms.CONTENT}));
				else reject('No tabs found');
			})
		});
	}

	async emitToBackground<T=any,R=any>(message:T){
		return callbackToPromise<R>(chrome.runtime.sendMessage, wrapMessage(message, {originRealm:this.realm, destinationRealm: Realms.BACKGROUND}));
	}

}


export const contentScriptHandler = new ContentScriptCommsHandler();
export const backgroundScriptHandler = new BackgroundScriptCommsHandler();
export const popupScriptHandler = new PopupScriptCommsHandler();

