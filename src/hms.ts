import { HMSLogLevel, HMSReactiveStore } from '@100mslive/hms-video-store';
import { HMSPeer, HMSRoomProvider } from '@100mslive/react-sdk';
import { IModelRegistryData } from './registry';

interface ISessionStore {
  presenterId: HMSPeer;
  isPresenting: boolean;
  node: HTMLElement;
  canLoadModel: boolean;
  modelRegistry: IModelRegistryData[];
  selectedModel: IModelRegistryData;
}
const hmsManager = new HMSReactiveStore<{ sessionStore: ISessionStore }>();

const TypedHMSRoomProvider = HMSRoomProvider<{
  sessionStore: ISessionStore;
}>;

hmsManager.triggerOnSubscribe();

const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getActions();
hmsActions.setLogLevel(HMSLogLevel.WARN);

export { TypedHMSRoomProvider, hmsActions, hmsStore };
