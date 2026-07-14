import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
    console.log("=================================");
    console.log("🚀 AASTU Campus Navigator API");
    console.log(`📡 Server running on port ${env.PORT}`);
    console.log(`🌐 http://localhost:${env.PORT}/api`);
    console.log("=================================");
});