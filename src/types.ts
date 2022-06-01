import {Realm} from "./realms";

export interface IScriptCommsHandler {

	tap():this;
	untap():this;
	registerInterfaces?(interfaces:Record<string, Function>):this;
	get methods():Record<string, any>;

}

export type AsyncFunction<Args=any, Ret=void> = (...args:Args[])=>Promise<Ret>;
export type SyncFunction<Args=any, Ret=void> = (...args:Args[])=>Ret;

export type Payload<T> = {
	$$excom: true,
	$$realms: { origin:Realm, destination:Realm },
	$$timestamp: number,
	$$message: T
}
