import { ThemeProvider } from "@gravity-ui/uikit";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import ReactDOM from "react-dom/client";
import { SignIn } from "./components/SignIn";
import "./style/reset.css";

const $app = document.getElementById("app")!;
const $root = ReactDOM.createRoot($app);

$root.render(<App />);

function App() {
  return (
    <ThemeProvider theme='system'>
      <SignIn />
    </ThemeProvider>
  );
}
