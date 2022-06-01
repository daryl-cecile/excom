import React, {useState, useEffect} from "react";
import {contentScriptHandler} from "@projectfunction/excom";

// @ts-ignore
import logo from "./logo.svg";
import "./App.css";

export default function App(){
	const [count, setCount] = useState(0);

	useEffect(()=>{
		contentScriptHandler.tap(); //start listening to messages and method calls

		contentScriptHandler.registerInterfaces({
			// expose updateCount() to increment count
			updateCount: async ()=>{
				setCount(prev => prev + 1);
				console.log('update called');
			}
		});

		return ()=>contentScriptHandler.untap(); // unsubscribe to messages and calls on cleanup
	}, []);

	return (
		<div>
			<header>
				<img src={logo} alt="app-logo"/>
				<p>Count is {count}</p>
			</header>
			<button onClick={()=>setCount(count => count + 1)}>Increment</button>
			<button onClick={()=>setCount(count => count - 1)}>Decrement</button>
			<button onClick={()=>{
				contentScriptHandler.backgroundMethods.openTab('https://google.com')
					.then(resp => console.log(resp, 'opened using background script'))
			}}>Open tab from background</button>
		</div>
	)
}