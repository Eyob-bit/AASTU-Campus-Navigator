import app from "./app.js";
import { env } from "./config/env.js";
import { RoadNavigationService } from "./services/roadNavigation.service.js";

app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);

    // Load the road graph up front so the first navigation request doesn't pay for it.
    void RoadNavigationService.warmGraphCache();
});
