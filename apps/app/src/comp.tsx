import ReactDOM from "react-dom";

export function Test() {
  return <div className="flex text-red-500">Hello world</div>;
}

export function render(el: HTMLElement) {
  ReactDOM.render(<Test />, el);
  return () => ReactDOM.unmountComponentAtNode(el);
}
