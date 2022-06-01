// @ts-ignore
import fs from "fs";
import manifest from "./manifest.base.json";

function getFiles(path:string, extension:string){
	const file = new RegExp(`^[a-z0-9]+\.${extension}$`);
	try {
		return fs.readdirSync(`./dist/${path}`)
				.filter(filename => file.test(filename))
				.map(filename => `${path}/${filename}`);
	}
	catch (e){
		return [];
	}
}

const backgroundJSFiles = getFiles('background', 'js');
const popupHtmlFiles = getFiles('popup', 'html');
const jsFiles = getFiles('', 'js');
const cssFiles = getFiles('', 'css');
const logoFiles = getFiles('', 'svg');

const newManifest = {
	...manifest,
	background: backgroundJSFiles.length > 0 ? { ...manifest.background, service_worker: backgroundJSFiles[0] } : manifest.background,
	content_scripts: [
		{
			...manifest.content_scripts[0],
			js: jsFiles,
			css: cssFiles
		}
	],
	web_accessible_resources: [
		{
			...manifest.web_accessible_resources[0],
			resources: [...cssFiles, ...logoFiles].filter(item => !!item)
		}
	],
	action: popupHtmlFiles.length > 0 ? { ...manifest.action, default_popup: popupHtmlFiles[0] } : manifest.action
};

fs.writeFileSync('./dist/manifest.json', JSON.stringify(newManifest, null, '\t'));