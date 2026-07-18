import { APP_NAME, APP_VERSION } from "../brand.js";

// Shared footer signature: platform name · version · copyright.
export default function Copyright({ className = "" }) {
  const year = new Date().getFullYear();
  return (
    <span className={className}>
      <span className="font-semibold">{APP_NAME}</span>{" "}
      <span className="tabular-nums opacity-80">v{APP_VERSION}</span>
      {" · "}© {year}{" "}
      <a
        href="https://www.deepakingwale.com"
        target="_blank"
        rel="noreferrer"
        className="font-medium underline-offset-2 hover:underline"
      >
        Deepak Ingwale
      </a>
      . All rights reserved.
    </span>
  );
}
