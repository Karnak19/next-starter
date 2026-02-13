/// <reference path="../pb_data/types.d.ts" />

// Example: Custom endpoint
routerAdd("GET", "/api/custom/hello", (e) => {
  console.log("Custom hello endpoint called");
  return e.json(200, {
    message: "Hello from pb_hooks!",
    timestamp: new Date().toISOString(),
  });
});

// Example: Log when a user is created
onRecordAfterCreateSuccess((e) => {
  console.log(`New user created: ${e.record.get("email")}`);
  e.next();
}, "users");

// Example: Log when a user signs in
onRecordAuthRequest((e) => {
  // This fires before auth, so we log after e.next()
  e.next();
  if (e.record) {
    console.log(`User signed in: ${e.record.get("email")}`);
  }
}, "users");
