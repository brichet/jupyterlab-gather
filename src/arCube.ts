import {
  selectAppData,
  selectIsSomeoneScreenSharing
} from '@100mslive/react-sdk';
//@ts-expect-error AR.js doesn't have type definitions
import * as THREEx from '@ar-js-org/ar.js/three.js/build/ar-threex.js';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { hmsActions, hmsStore } from './hms';
import { IModelRegistryData } from './registry';
const FIRST_SCENE = 0;
const SECOND_SCENE = 1;

class ArCube {
  sceneGroup2: THREE.Group<THREE.Object3DEventMap>;
  gltfModel2: THREE.Group<THREE.Object3DEventMap>;
  /**
   * Construct a new JupyterLab-Gather widget.
   */
  constructor(node: HTMLElement) {
    this.initialize();
    // this.animate();
    // window.addEventListener('markerFound', () => {
    //   console.log('Marker found');
    // });

    // window.addEventListener('markerLost', () => {
    //   console.log('Marker lost');
    // });
  }

  clock: THREE.Clock;
  scene: THREE.Scene;
  camera: THREE.Camera;
  arToolkitSource: any;
  arToolkitContext: any;
  markerRootArray: THREE.Group[];
  markerGroupArray: THREE.Group[];
  hiroRootArray: THREE.Group[];
  hiroGroupArray: THREE.Group[];
  patternArray: string[];
  patternArraySecondModel: string[];
  // sceneGroup: THREE.Group;
  // sceneGroupArray: THREE.Group[];
  // edgeGroup: THREE.Group;
  gltfLoader: GLTFLoader;
  // gltfModel: THREE.Group;
  animations: THREE.AnimationClip[] | undefined;
  mixer: THREE.AnimationMixer;
  renderer: THREE.WebGLRenderer;
  mixerUpdateDelta: number;
  // observer: IntersectionObserver;
  existingWebcam: HTMLVideoElement | null;
  newWebcam: HTMLVideoElement | undefined;
  webcam_loaded: Promise<void>;
  resolve: any;
  deltaTime: number;
  totalTime: number;
  // readonly markerControls: any;
  // readonly ambientLight: THREE.AmbientLight;
  // readonly rotationArray: THREE.Vector3[];
  // readonly markerRoot: THREE.Group;
  // readonly markerGroup: THREE.Group;
  // readonly pointLight: THREE.PointLight;
  // readonly loader: THREE.TextureLoader;
  // readonly stageMesh: THREE.MeshBasicMaterial;
  // readonly stage: THREE.Mesh;
  // readonly edgeGeometry: THREE.CylinderGeometry;
  // readonly edgeCenters: THREE.Vector3[];
  // readonly edgeRotations: THREE.Vector3[];
  okToLoadModel: boolean;
  // readonly animationRequestId: number | undefined;
  // readonly now: number;
  // readonly then: number;
  // readonly elapsed: number;
  // readonly fpsInterval: number;
  //   readonly webcamFromArjs: HTMLElement | null;
  // readonly node: HTMLElement;
  renderTarget: THREE.WebGLRenderTarget;
  // model: IModelRegistryData;
  sceneGroups: THREE.Group[];
  isSecondScene: boolean;

  initialize() {
    this.sceneGroups = [];

    this.setupThreeStuff();

    this.setupSource();

    this.setupContext();

    this.setupMarkerRoots();

    this.setupScene(FIRST_SCENE);
    // this.setupScene(1);
  }

  setupThreeStuff() {
    console.log('setting up threee stuff');

    this.okToLoadModel = true;
    this.scene = new THREE.Scene();

    // promise to track if AR.js has loaded the webcam
    this.webcam_loaded = new Promise(resolve => {
      this.resolve = resolve;
    });

    window.addEventListener('arjs-video-loaded', (e: any) => {
      e.detail.component.style.display = 'none';
      this.resolve();
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    this.camera = new THREE.Camera();
    this.scene.add(this.camera);

    // Camera lights
    const camLight = new THREE.DirectionalLight(0xffffff, 1);
    camLight.position.set(-1, 2, 4);
    this.camera.add(camLight);

    // const canvas = document.getElementById('target') as HTMLCanvasElement;

    // const offscreen = canvas?.transferControlToOffscreen();
    // if (!canvas?.transferControlToOffscreen) {
    //   console.log('no support');
    // }

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // canvas: canvas,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });

    this.renderer.setClearColor(new THREE.Color('lightgrey'), 0);

    //Not render target things
    const isScreenShareOn = hmsStore.getState(selectIsSomeoneScreenSharing); //useHMSStore(selectIsSomeoneScreenSharing);

    if (isScreenShareOn) {
      console.log('iffing');
      const container = document.getElementById('screen-share-container');
      container?.appendChild(this.renderer.domElement);
    } else {
      // Renderer target things
      console.log('elsing');
      this.renderTarget = new THREE.WebGLRenderTarget();
      this.renderTarget.setSize(1280, 720);
      this.renderer.setRenderTarget(this.renderTarget);
    }

    // this.renderer.setSize(1280, 720, false);
    // this.renderer.domElement.style.position = 'absolute';

    // this.renderer.domElement.style.top = '0px';
    // this.renderer.domElement.style.left = '0px';

    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.totalTime = 0;

    hmsActions.setAppData('renderer', this.renderer);
  }

  setupSource() {
    console.log('setting up source');

    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: 'webcam'
    });

    this.arToolkitSource.init();
  }

  setupContext() {
    console.log('setting up context');

    // create atToolkitContext
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
      detectionMode: 'mono'
    });

    // copy projection matrix to camera when initialization complete
    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix()
      );
    });
  }

  setupMarkerRoots() {
    console.log('setting up marker roots');

    this.markerRootArray = [];
    this.markerGroupArray = [];

    this.hiroRootArray = [];
    this.hiroGroupArray = [];

    this.patternArray = [
      'letterA',
      'letterB',
      'letterC',
      'letterD',
      'letterF',
      'kanji'
    ];

    this.patternArraySecondModel = [
      'letterJ',
      'letterK',
      'letterL',
      'letterM',
      'letterN',
      'letterP'
    ];

    const rotationArray = [
      new THREE.Vector3(-Math.PI / 2, 0),
      new THREE.Vector3(0, -Math.PI / 2, Math.PI / 2),
      new THREE.Vector3(Math.PI / 2, 0, Math.PI),
      new THREE.Vector3(-Math.PI / 2, Math.PI / 2, 0),
      new THREE.Vector3(Math.PI, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ];

    for (let i = 0; i < 6; i++) {
      const markerRoot = new THREE.Group();
      this.markerRootArray.push(markerRoot);
      this.scene.add(markerRoot);
      const markerControls = new THREEx.ArMarkerControls(
        this.arToolkitContext,
        markerRoot,
        {
          type: 'pattern',
          patternUrl:
            THREEx.ArToolkitContext.baseURL +
            'examples/marker-training/examples/pattern-files/pattern-' +
            this.patternArray[i] +
            '.patt'
        }
      );

      const markerGroup = new THREE.Group();
      this.markerGroupArray.push(markerGroup);
      markerGroup.position.y = -1.25 / 2;
      markerGroup.rotation.setFromVector3(rotationArray[i]);

      markerRoot.add(markerGroup);
    }

    for (let i = 0; i < 6; i++) {
      const hiroRoot = new THREE.Group();
      this.hiroRootArray.push(hiroRoot);
      this.scene.add(hiroRoot);
      const hiroControls = new THREEx.ArMarkerControls(
        this.arToolkitContext,
        hiroRoot,
        {
          type: 'pattern',
          patternUrl:
            'https://raw.githubusercontent.com/gjmooney/jupyterlab-gather/main/pattern-files/pattern-' +
            this.patternArraySecondModel[i] +
            '.patt'
        }
      );

      const hiroGroup = new THREE.Group();
      this.hiroGroupArray.push(hiroGroup);
      hiroGroup.position.y = -1.25 / 2;
      hiroGroup.rotation.setFromVector3(rotationArray[i]);

      hiroRoot.add(hiroGroup);
    }
  }

  setupScene(sceneNumber: number) {
    console.log('setting up scene');
    const sceneGroup = new THREE.Group();
    // a 1x1x1 cube model with scale factor 1.25 fills up the physical cube
    sceneGroup.scale.set(1.75 / 2, 1.75 / 2, 1.75 / 2);
    sceneGroup.name = `scene${sceneNumber}`;

    // reversed cube
    //TODO: Can probably just have one cube and add it to scenes as needed
    sceneGroup.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({
          color: '#2EEEFF',
          side: THREE.BackSide
        })
      )
    );

    // cube edges
    const edgeGroup = new THREE.Group();
    const edgeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 32);

    const edgeCenters = [
      new THREE.Vector3(0, -1, -1),
      new THREE.Vector3(0, 1, -1),
      new THREE.Vector3(0, -1, 1),
      new THREE.Vector3(0, 1, 1),
      new THREE.Vector3(-1, 0, -1),
      new THREE.Vector3(1, 0, -1),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Vector3(1, 0, 1),
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, 1, 0)
    ];

    const edgeRotations = [
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0)
    ];

    for (let i = 0; i < 12; i++) {
      const edge = new THREE.Mesh(
        edgeGeometry,
        new THREE.MeshLambertMaterial({
          color: '#262626'
        })
      );
      edge.position.copy(edgeCenters[i]);
      edge.rotation.setFromVector3(edgeRotations[i]);

      edgeGroup.add(edge);
    }

    sceneGroup.add(edgeGroup);
    this.sceneGroups.push(sceneGroup);

    this.loadModel(sceneNumber);
    console.log('fin');
  }

  loadModel(sceneNumber: number, modelName?: string) {
    console.log('loading model');
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
    }

    const model = this.findModelByName(modelName ? modelName : 'duck');

    // remove old model first
    // if (this.gltfModel) {
    //   this.removeFromScene(sceneNumber, this.gltfModel);
    // }

    // load model
    // eslint-disable-next-line no-constant-condition
    if (true) {
      this.okToLoadModel = false;
      hmsActions.setAppData('canLoadModel', false);

      if ('url' in model) {
        this.gltfLoader.load(
          model.url,
          gltf => {
            this.onSuccessfulLoad(gltf, sceneNumber);
          },
          () => {
            console.log('model loading');
          },
          error => {
            console.log('Error loading model url', error);
          }
        );
      } else if ('gltf' in model) {
        const data = JSON.stringify(model.gltf);
        this.gltfLoader.parse(
          data,
          '',
          gltf => {
            this.onSuccessfulLoad(gltf, sceneNumber);
          },
          error => {
            console.log('Error loading model gltf', error);
          }
        );
      }
    }
  }

  onSuccessfulLoad = (gltf: GLTF, sceneNumber: number) => {
    console.log('on successful load');
    const scale = 1.0;
    const gltfModel = gltf.scene;
    gltfModel.scale.set(scale, scale, scale);
    gltfModel.position.fromArray([0, -1, 0]);

    gltfModel.name = `model${sceneNumber}`;
    this.animations = gltf.animations;
    this.mixer = new THREE.AnimationMixer(gltfModel);

    if (this.animations) {
      this.animations.forEach(clip => {
        this.mixer.clipAction(clip).play();
      });
    }

    this.sceneGroups[sceneNumber].add(gltfModel);
    this.okToLoadModel = true;
    hmsActions.setAppData('canLoadModel', true);
    console.log('model loaded parse');
  };

  findModelByName(name: string) {
    const modelRegistry = hmsStore.getState(selectAppData('modelRegistry'));

    return modelRegistry.find(
      (model: IModelRegistryData) => model.name === name
    );
  }

  changeModelInScene(sceneNumber: number, modelName: string) {
    const sceneGroup = this.sceneGroups[sceneNumber];
    const modelToRemove = sceneGroup.getObjectByName(`model${sceneNumber}`);

    if (modelToRemove) {
      sceneGroup.remove(modelToRemove);
    }

    this.loadModel(sceneNumber, modelName);
  }

  removeFromScene(sceneNumber: number, object3d: THREE.Object3D) {
    this.sceneGroups[sceneNumber].remove(object3d);
  }

  enableSecondScene() {
    console.log('enaling');
    this.isSecondScene = true;
    this.setupScene(SECOND_SCENE);
  }

  disableSecondScene() {
    console.log('disabling');
    this.isSecondScene = false;
    //TODO this won't work with more than two scenes but it's fine for now
    this.sceneGroups.pop();
  }

  resizeCanvasToDisplaySize() {
    const canvas = this.renderer.domElement;
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // console.log('canvas.width in resize', canvas.width);
    // console.log('width in resize', width);
    // adjust displayBuffer size to match
    if (canvas.width !== width || canvas.height !== height) {
      // you must pass false here or three.js sadly fights the browser
      this.renderer.setSize(width, height, false);
      // this.camera.aspect = width / height;
      // this.camera.updateProjectionMatrix();

      // update any render target sizes here
    }
  }

  render() {
    // this.renderer.setRenderTarget(this.renderTarget);
    // this.renderer.render(this.scene, this.camera);
    // this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));

    this.deltaTime = this.clock.getDelta();
    this.totalTime += this.deltaTime;

    this.update();

    if (this.mixer) {
      this.mixerUpdateDelta = this.clock.getDelta();
      this.mixer.update(this.mixerUpdateDelta);
    }

    this.render();
  }

  update() {
    // update artoolkit on every frame
    if (this.arToolkitSource.ready !== false) {
      this.arToolkitContext.update(this.arToolkitSource.domElement);
    }

    // console.log('root array', this.markerRootArray);

    for (let i = 0; i < 6; i++) {
      if (this.markerRootArray[i].visible) {
        //TODO want to iterate through new scene group list
        this.markerGroupArray[i].add(this.sceneGroups[0]);
        // console.log('visible: ' + this.patternArray[i]);
        break;
      }
    }

    if (this.isSecondScene) {
      for (let i = 0; i < 6; i++) {
        if (this.hiroRootArray[i].visible) {
          //TODO want to iterate through new scene group list
          this.hiroGroupArray[i].add(this.sceneGroups[1]);
          // console.log('visible: ' + this.patternArraySecondModel[i - 6]);
          break;
        }
      }
    }
  }
}

export default ArCube;
