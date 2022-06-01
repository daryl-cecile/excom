import React, {useEffect} from "react";
import {popupScriptHandler} from "@projectfunction/excom";

export default function App(){
	useEffect(()=>{
		popupScriptHandler.tap(); //start listening to messages and method calls

		return ()=>popupScriptHandler.untap(); // unsubscribe to messages and calls on cleanup
	}, []);

	return (
		<div>
			<button onClick={()=> {
				popupScriptHandler.contentMethods.updateCount();
			}}>Increment In-page count</button>
			<button onClick={()=>{
				popupScriptHandler.backgroundMethods.openTab('https://youtube.com')
					.then(resp => console.log(resp, 'opened using background script'))
			}}>Open tab from background</button>
		</div>
	)
}
