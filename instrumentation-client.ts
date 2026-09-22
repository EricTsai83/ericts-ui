// Load the installed development tool outside React's render tree. Importing
// it here avoids rendering a script element during client navigation / HMR.
if (process.env.NODE_ENV === "development") {
  void import("react-grab").catch((error: unknown) => {
    console.warn("React Grab could not be initialized", error);
  });
}
