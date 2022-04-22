/**
 * Creating pinia stores for options API might require the following to 
 * infer the correct store names.
 * https://pinia.vuejs.org/cookbook/options-api.html
 */

import { createPinia, setMapStoreSuffix } from "pinia";

// the default mapStores behavrior appends 'Store': this.videoStore

// completely remove the suffix: this.video
setMapStoreSuffix("");

// appends '_store': this.video_store
// setMapStoreSuffix('_store')

export const pinia = createPinia();
