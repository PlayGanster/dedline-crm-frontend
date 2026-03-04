export interface RouteType {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  haveLayout?: boolean;
}

export interface RouterProps {
  routes: RouteType[];
}
