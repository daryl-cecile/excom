# excom
 
Excom is simple library to help simplify communication between your content, background, and popup scripts across your
Chrome extension. Its main goal is to allow you to focus on direct logic without having to worry about managing the sending
and receiving of messages between those realms.


### Getting Started

This library is distributed in esm format only, and exposes 3 handlers for you to use. To get started, install the npm
package:

```shell
yarn add @projectfunction/excom
```

Once installed, you can go ahead and import the relevant handler in each script:

```typescript
// background.js

import {backgroundScriptHandler} from "@projectfunction/excom";
```

```typescript
// popup.js

import {popupScriptHandler} from "@projectfunction/excom";
```

```typescript
// inject.js

import {contentScriptHandler} from "@projectfunction/excom";
```

Each of these handlers are instances of the underlying script communication handler that excom uses to handle communication
between the three realms. To ensure the handlers are ready, simply call the `.tap()` method. This causes the handlers to begin
listening for lifecycle events and messaging. When using in a react-environment, you may need to handle cleanup (i.e. upon unmount);
to do this you can use the `.untap()` method. For example:

```typescript jsx
import {contentScriptHandler} from "@projectfunction/excom";

export default function App(){
	const [count, setCount] = useState(0);
	
	useEffect(()=>{
		contentScriptHandler.tap(); // set up handler
		
		return ()=>{
			contentScriptHandler.untap() // clean up
		}
	}, []);
	
}
```

### Methods

Throughout your extension, you may want to call methods in your background script from your content script or popup; Excom
makes this easy by allowing you to define function-interfaces that script in other realms (i.e. content-script, background-script, popup, etc)
need to call. To do this, you can use the `.registerInterfaces({...})` method of the relevant handlers where you want the methods
to live.

```typescript
// inside background.js 
import {backgroundScriptHandler} from "@projectfunction/excom";

backgroundScriptHandler.tap(); // make sure this is done before interfaces are registered

backgroundScriptHandler.registerInterfaces({
	openTab: async function(url) {
		let tab = await chrome.tabs.create({ url, active: false });
		console.log('tab created from the background script', tab.id);
		return 42; // return some value if needed
	}
});

```

Once defined, that method can then be called from other realms:

```typescript
// inside inject.js 
import {contentScriptHandler} from "@projectfunction/excom";

let response = await contentScriptHandler.backgroundMethods.openTab('https://google.com');

// expect(response).toEqual(42);
```

> **Warning**
> All functions to be exposed across realms should be async to avoid race conditions!