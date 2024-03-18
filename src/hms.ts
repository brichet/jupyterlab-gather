import { HMSReactiveStore } from '@100mslive/hms-video-store';

const hmsManager = new HMSReactiveStore();

hmsManager.triggerOnSubscribe();

const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getActions();

export { hmsActions, hmsStore };
