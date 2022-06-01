import {Realm} from "./realms";
import {Payload} from "./types";

export const callbackToPromise = async <K=any, T extends Function=Function>(method:T, ...params:any[]):Promise<K> => {
	return new Promise((resolve, reject) => {
		const parameters = [...params, resolve];
		try {
			method.call(method, ...parameters);
		}
		catch (e){
			reject(e);
		}
	});
}

export const wrapMessage = <T=any>(message:T, options:{originRealm:Realm, destinationRealm:Realm}):Payload<T> => {
	return {
		$$excom: true,
		$$realms: { origin: options.originRealm, destination: options.destinationRealm },
		$$timestamp: new Date().getTime(),
		$$message: message
	}
}

