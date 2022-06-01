import {backgroundScriptHandler} from "@projectfunction/excom";

// as this script will be in a service_worker, chrome will periodically suspend the worker when not in use,
// so we want to tap into the listener everytime this script is ran (i.e. when it starts after install or is unsuspended)
backgroundScriptHandler.tap();

backgroundScriptHandler.registerInterfaces({
	openTab: async (url:string) => {
		let tab = await chrome.tabs.create({ url, active: false });
		console.log('Created tab from background script', tab.id);
		return 42; // we can return any value
	}
});

/*
In some cases we may want to capture messages sent from different realms,
to do this we can simply emit messages to the specific realms:

backgroundScriptHandler.addListener('message', message => {

	// we can use emit to respond too.
	backgroundScriptHandler.emitToContent(`GOT ${message}`);
});
 */