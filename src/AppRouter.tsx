import React, { useState, useEffect, FunctionComponent, Component, ComponentClass } from "react";
import { BrowserRouter as Router, Route, Link, RouteProps, RouteComponentProps, Switch, Redirect } from "react-router-dom";

const apiHost = 'http://localhost:8080/Plone';

interface Item {
	'@id': string;
	'title': string;
}

interface Navigation {
	'@id': string;
	items: NavigationItem[];
}

interface NavigationItem extends Item {
	'descriptoin': string;
	items?: "" | NavigationItem[];
}

const Navigation: FunctionComponent<RouteComponentProps> = (props) => {
	const [navigation, setNavigation] = useState<Navigation>({ '@id': '', items: [] });
	useEffect(() => {
		let cancel = false;
		async function fetchNavigation() {
			const url = apiHost + props.match.url + '/@navigation?expand.navigation.depth=2';
			const result = await fetch(url, {
				headers: { 'Accept': 'application/json' },
			});
			const navigation: Navigation = await result.json();
			if (!cancel) {
				setNavigation(navigation);
			}
		}
		fetchNavigation();
		return () => {
			cancel = true;
		}
	}, [props.match.url]);

	return (
		<>
			<ul>
				{navigation.items.map(item => {
					const to = item['@id'].substring(apiHost.length);
					return <li key={to}>
						<Link to={to}>{item.title}</Link>
					</li>
				})}
			</ul>
		</>
	);
};

interface Breadcrumbs {
	'@id': string;
	items: BreadcrumbItem[];
}
interface BreadcrumbItem extends Item {
}
const Breadcrumbs: FunctionComponent<RouteComponentProps> = (props) => {
	const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumbs>({ '@id': '', items: [] });
	useEffect(() => {
		let cancel = false;
		async function fetchBreadcrumbs() {
			const url = apiHost + props.match.url + '/@breadcrumbs?';
			const result = await fetch(url, {
				headers: { 'Accept': 'application/json' },
			});
			const breadcrumbs: Breadcrumbs = await result.json();
			if (!cancel) {
				setBreadcrumbs(breadcrumbs);
			}
		}
		fetchBreadcrumbs();
		return () => {
			cancel = true;
		}
	}, [props.match.url]);

	return (
		<>
			You are here: <Link to="/">Home</Link>
			{breadcrumbs.items.map(item => {
				const to = item['@id'].substring(apiHost.length);
				return <span key={to}> &gt; <Link to={to}>{item.title}</Link></span>
			})}
		</>
	);
};

type ReviewState = 'private' | 'something else';

interface Content extends Item {
	'@components': { [component: string]: string };
	'@id': string;
	"@type": 'Folder' | 'Document' | 'News Item' | 'Collection';
	"UID": string;
	"allow_discussion": boolean;
	"contributors": string[];
	"created": string;
	"creators": string[];
	'description': string;
	"effective": string | null;
	"exclude_from_nav": boolean;
	"expires": string | null;
	"id": string;
	'image'?: {
		download: string;
		height: number;
		width: number;
	};
	image_caption: string;
	"is_folderish": false,
	items: Item[] | null;
	'items_total': number;
	"language": string;
	"layout"?: 'document_view' | 'listing_view' | "newsitem_view";
	"modified": string;
	"parent": Content;
	"relatedItems": Content[],
	'review_state': ReviewState,
	"rights": string,
	"subjects": [],
	"table_of_contents": null,
	"text": null | {
		'content-type': 'text/html',
		'data': string,
		'encoding': 'utf-8',
	};
	"tiles": {
		[id: string]: {
			'@type': string,
			'text'?: {
				'blocks': [],
				'entityMap': {},
			},
		},
	};
	'tiles_layout': {
		'items': [],
		'title': string,
	};
	"version": "current" | 'something else',
	"versioning_enabled": boolean;
}

interface ContextInfo {
	defaultPage: string;
}

const View: FunctionComponent<RouteComponentProps> = (props) => {
	const [blah, setBlah] = useState<Content | null>(null);
	useEffect(() => {
		let cancel = false;
		async function fetchBlah() {
			const url = apiHost + props.match.url;
			const result = await fetch(url, {
				headers: { 'Accept': 'application/json' },
			});
			const blah: Content = await result.json();
			if (!cancel) {
				setBlah(blah);
			}
		}
		fetchBlah();
		return () => {
			cancel = true;
		}
	}, [props.match.url]);
	useEffect(() => {
		if (blah && blah.items && blah.items[0]) {
			const to = blah.items[0]['@id'].substring(apiHost.length);
			props.history.push(to);
			// const defaultPageProps = {
			// 	...props,
			// 	match: {
			// 		...props.match,
			// 		url: props.match.url + to,
			// 	},
			// };
			// setView(<View {...defaultPageProps}/>);
		}
	}, [blah]);

	if (blah) {
		if (blah.text) {
			return <>
				<h2>{blah.title}</h2>
				<strong>{blah.description}</strong>
				{blah.image ? <figure><img src={blah.image.download}/><figcaption>{blah.image_caption}</figcaption></figure> : ''}
				<div dangerouslySetInnerHTML={{ __html: blah.text.data }} />
			</>;
		}
		else {
			return <>This is a folder with no default view?</>;
		}
	}
	else {
		return <>Loading</>;
	}
}

function About() {
	return <h2>About</h2>;
}

function Users() {
	return <h2>Users</h2>;
}

interface LayoutRouteProps extends RouteProps {
	component: NonNullable<RouteProps['component']>;
}
const LayoutRoute: FunctionComponent<LayoutRouteProps> = ({ component, ...rest }) => {
	const ViewComponent = component;
	return (
		<Route {...rest} render={match => (
			<>
				<Navigation {...match}></Navigation>
				<Breadcrumbs {...match}></Breadcrumbs>
				<ViewComponent {...match} />
			</>
		)} />
	);
};

function AppRouter() {
	return (
		<Router>
			<Switch>
				<LayoutRoute path="/" exact component={View} />
				<LayoutRoute path="/**" component={View} />
			</Switch>
		</Router>
	);
}

export default AppRouter;