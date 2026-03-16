import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const SCENES = [
    {
        id: 'office-seq-07',
        title: 'Office Seq-07',
        views: 300,
        left: {
            title: 'CUT w/o MeMix',
            src: './static/models/examples/cut-office-seq-07.glb'
        },
        right: {
            title: 'CUT w/ MeMix',
            src: './static/models/examples/cut-w-memix-office-seq-07.glb'
        }
    },
    {
        id: 'green-room',
        title: 'Green Room',
        views: 500,
        left: {
            title: 'CUT w/o MeMix',
            src: './static/models/examples/cut-green-room.glb'
        },
        right: {
            title: 'CUT w/ MeMix',
            src: './static/models/examples/cut-w-memix-green-room.glb'
        }
    },
    {
        id: 'fire-seq-03',
        title: 'Fire Seq-03',
        views: 400,
        left: {
            title: 'TTT w/o MeMix',
            src: './static/models/examples/ttt-fire-seq-03.glb'
        },
        right: {
            title: 'TTT w/ MeMix',
            src: './static/models/examples/ttt-w-memix-fire-seq-03.glb'
        }
    }
];

const DEFAULT_SCENE_ID = SCENES[0].id;
const MAX_CACHED_ASSETS = 6;
const MODEL_ASSET_VERSION = '20260316-quant1';
const ASSET_CACHE = new Map();
let assetCacheStamp = 0;

function getAssetUrl(asset) {
    return `${asset.src}?v=${MODEL_ASSET_VERSION}`;
}

function markAssetEntryUsed(entry) {
    entry.lastUsedAt = ++assetCacheStamp;
}

function disposeAssetEntry(entry) {
    if (!entry || !entry.root) {
        return;
    }

    entry.root.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }

        if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
                if (material && typeof material.dispose === 'function') {
                    material.dispose();
                }
            });
        }
    });
}

function pruneAssetCache() {
    const readyEntries = Array.from(ASSET_CACHE.values()).filter((entry) => entry.status === 'ready');
    if (readyEntries.length <= MAX_CACHED_ASSETS) {
        return;
    }

    const disposableEntries = readyEntries
        .filter((entry) => !entry.attachedTo)
        .sort((left, right) => left.lastUsedAt - right.lastUsedAt);

    let overflow = readyEntries.length - MAX_CACHED_ASSETS;
    while (overflow > 0 && disposableEntries.length) {
        const entry = disposableEntries.shift();
        ASSET_CACHE.delete(entry.url);
        disposeAssetEntry(entry);
        overflow -= 1;
    }
}

class DemoViewer {
    constructor(root) {
        this.root = root;
        this.root.tabIndex = 0;
        this.syncGroup = root.dataset.demoSyncGroup || '';
        this.panel = root.dataset.demoPanel || '';
        this.ready = false;
        this.initialized = false;
        this.renderPending = true;
        this.isApplyingSync = false;
        this.syncTween = null;
        this.currentEntry = null;
        this.loadVersion = 0;
        this.loader = new GLTFLoader();
        this.card = root.closest('.demo-viewer-card');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(28, 1, 0.01, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.domElement.className = 'demo-canvas';
        this.root.appendChild(this.renderer.domElement);

        this.status = root.querySelector('.demo-status') || document.createElement('div');
        if (!this.status.parentElement) {
            this.status.className = 'demo-status';
            this.root.appendChild(this.status);
        }

        this.controls = null;
        this.resizeObserver = null;
        this.boundingCenter = new THREE.Vector3();
        this.boundingSize = new THREE.Vector3(1, 1, 1);
        this.referenceViewDistance = 1;
        this.pointClouds = [];
    }

    initialize() {
        if (this.initialized) {
            return;
        }

        this.initControls();
        this.initScene();
        this.mountResizeObserver();
        this.handleResize();
        this.initialized = true;
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 0.05;
        this.controls.maxDistance = 200;
        this.controls.keyPanSpeed = 24;
        this.controls.keys = {
            LEFT: 'KeyA',
            UP: 'KeyW',
            RIGHT: 'KeyD',
            BOTTOM: 'KeyS'
        };
        this.controls.addEventListener('change', () => {
            this.renderPending = true;
        });
    }

    initScene() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.15);
        const key = new THREE.DirectionalLight(0xffffff, 0.55);
        key.position.set(2, 3, 4);
        this.scene.add(ambient, key);
    }

    setStatus(text, isError = false) {
        this.status.textContent = text;
        this.status.classList.toggle('is-error', isError);
        this.status.hidden = false;
        this.status.style.display = 'flex';
        this.status.setAttribute('aria-hidden', 'false');
    }

    hideStatus() {
        this.status.hidden = true;
        this.status.style.display = 'none';
        this.status.setAttribute('aria-hidden', 'true');
    }

    setError(message) {
        this.ready = false;
        this.setStatus(message, true);
        this.root.classList.add('is-error');
    }

    handleResize() {
        const width = Math.max(this.root.clientWidth, 1);
        const height = Math.max(this.root.clientHeight, 1);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        this.renderPending = true;
    }

    mountResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            this.resizeObserver.observe(this.root);
        } else {
            window.addEventListener('resize', () => this.handleResize());
        }
    }

    applyRenderableStyle(object, pointClouds = this.pointClouds, boundingSize = this.boundingSize) {
        const geometry = object.geometry;
        const hasColor = Boolean(geometry && geometry.getAttribute('color'));
        const positionAttribute = geometry ? geometry.getAttribute('position') : null;
        const vertexCount = positionAttribute ? positionAttribute.count : 0;

        if (object.isPoints) {
            const diagonal = boundingSize.length();
            const densityFactor = THREE.MathUtils.clamp(1.16 - Math.log10(Math.max(vertexCount, 10)) * 0.08, 0.72, 1.02);
            const basePointSize = THREE.MathUtils.clamp(diagonal * 3.2 * densityFactor, 3.8, 8.6) * 0.06;
            object.material = new THREE.PointsMaterial({
                size: basePointSize,
                sizeAttenuation: false,
                vertexColors: hasColor,
                transparent: false,
                opacity: 1,
                depthTest: true,
                depthWrite: true
            });
            object.userData.basePointSize = basePointSize;
            pointClouds.push(object);
            return;
        }

        if (object.isMesh) {
            const material = new THREE.MeshBasicMaterial({
                color: hasColor ? 0xffffff : 0xd9dfda,
                vertexColors: hasColor,
                transparent: object.material ? Boolean(object.material.transparent) : false,
                opacity: object.material && typeof object.material.opacity === 'number' ? object.material.opacity : 1,
                depthWrite: !(object.material && object.material.transparent)
            });
            material.side = THREE.DoubleSide;
            object.material = material;
        }
    }

    orientScene(root) {
        root.rotation.y += Math.PI;
        root.updateMatrixWorld(true);
    }

    updateBounds(root, center = this.boundingCenter, size = this.boundingSize) {
        const box = new THREE.Box3().setFromObject(root);
        if (box.isEmpty()) {
            center.set(0, 0, 0);
            size.set(1, 1, 1);
            return;
        }

        box.getCenter(center);
        box.getSize(size);
    }

    updatePointCloudSizes(force = false) {
        if (!this.pointClouds.length || !this.controls) {
            return false;
        }

        const currentDistance = Math.max(this.camera.position.distanceTo(this.controls.target), 0.001);
        const magnification = THREE.MathUtils.clamp((this.referenceViewDistance / currentDistance) * this.camera.zoom, 0.7, 3.4);
        let changed = false;

        this.pointClouds.forEach((points) => {
            const baseSize = points.userData.basePointSize || 4.8;
            const nextSize = THREE.MathUtils.clamp(baseSize * magnification, 0.192, 1.08);
            if (force || Math.abs(points.material.size - nextSize) > 0.02) {
                points.material.size = nextSize;
                changed = true;
            }
        });

        return changed;
    }

    frameScene(root) {
        const maxDim = Math.max(this.boundingSize.x, this.boundingSize.y, this.boundingSize.z, 0.001);
        const fov = this.camera.fov * Math.PI / 180;
        const distance = ((maxDim / (2 * Math.tan(fov / 2))) * 1.55) / 1.8;

        this.camera.position.set(
            this.boundingCenter.x + distance * 0.72,
            this.boundingCenter.y + distance * 0.48,
            this.boundingCenter.z + distance
        );
        this.camera.near = Math.max(distance / 1000, 0.01);
        this.camera.far = Math.max(distance * 30, 100);
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.target.copy(this.boundingCenter);
            this.controls.update();
        }

        this.referenceViewDistance = this.camera.position.distanceTo(this.boundingCenter);
        this.renderPending = true;
    }

    prepareAssetRoot(root) {
        const preparedCenter = new THREE.Vector3();
        const preparedSize = new THREE.Vector3(1, 1, 1);
        const preparedPointClouds = [];

        this.orientScene(root);
        this.updateBounds(root, preparedCenter, preparedSize);
        root.traverse((object) => {
            this.applyRenderableStyle(object, preparedPointClouds, preparedSize);
        });

        return {
            root,
            boundingCenter: preparedCenter,
            boundingSize: preparedSize,
            pointClouds: preparedPointClouds
        };
    }

    getPreparedAssetEntry(asset) {
        const assetUrl = getAssetUrl(asset);
        const cachedEntry = ASSET_CACHE.get(assetUrl);
        if (cachedEntry) {
            markAssetEntryUsed(cachedEntry);
            return cachedEntry.promise;
        }

        const entry = {
            src: asset.src,
            url: assetUrl,
            status: 'loading',
            attachedTo: null,
            lastUsedAt: 0,
            root: null,
            pointClouds: [],
            boundingCenter: new THREE.Vector3(),
            boundingSize: new THREE.Vector3(1, 1, 1),
            promise: null
        };

        entry.promise = new Promise((resolve, reject) => {
            this.loader.load(
                assetUrl,
                (gltf) => {
                    const root = gltf.scene || gltf.scenes[0];
                    if (!root) {
                        ASSET_CACHE.delete(assetUrl);
                        reject(new Error('No renderable scene found in GLB.'));
                        return;
                    }

                    const prepared = this.prepareAssetRoot(root);
                    entry.status = 'ready';
                    entry.root = prepared.root;
                    entry.pointClouds = prepared.pointClouds;
                    entry.boundingCenter.copy(prepared.boundingCenter);
                    entry.boundingSize.copy(prepared.boundingSize);
                    markAssetEntryUsed(entry);
                    resolve(entry);
                },
                undefined,
                (error) => {
                    ASSET_CACHE.delete(assetUrl);
                    reject(error);
                }
            );
        });

        ASSET_CACHE.set(assetUrl, entry);
        markAssetEntryUsed(entry);
        return entry.promise;
    }

    prefetchAsset(asset) {
        this.initialize();
        this.getPreparedAssetEntry(asset).catch((error) => {
            console.warn('Prefetch failed for asset:', asset.src, error);
        });
    }

    detachCurrentEntry() {
        if (!this.currentEntry) {
            return;
        }

        if (this.currentEntry.root && this.currentEntry.root.parent === this.scene) {
            this.scene.remove(this.currentEntry.root);
        }

        this.currentEntry.attachedTo = null;
        this.currentEntry = null;
    }

    attachPreparedEntry(entry) {
        this.detachCurrentEntry();

        this.currentEntry = entry;
        entry.attachedTo = this;
        markAssetEntryUsed(entry);

        if (entry.root.parent && entry.root.parent !== this.scene) {
            entry.root.parent.remove(entry.root);
        }

        this.pointClouds = entry.pointClouds;
        this.boundingCenter.copy(entry.boundingCenter);
        this.boundingSize.copy(entry.boundingSize);
        this.scene.add(entry.root);
    }

    setKeyboardActive(isActive) {
        if (!this.controls) {
            return;
        }

        if (isActive) {
            this.controls.listenToKeyEvents(window);
        } else {
            this.controls.stopListenToKeyEvents();
        }

        this.root.classList.toggle('is-interaction-active', isActive);
        if (this.card) {
            this.card.classList.toggle('is-interaction-active', isActive);
        }
    }

    loadAsset(asset) {
        this.initialize();
        this.ready = false;
        this.root.classList.remove('is-error');
        this.setStatus('Loading 3D scene...');

        const version = ++this.loadVersion;

        if (this.currentEntry && this.currentEntry.src === asset.src) {
            this.ready = true;
            markAssetEntryUsed(this.currentEntry);
            this.hideStatus();
            this.renderPending = true;
            return Promise.resolve(true);
        }

        return this.getPreparedAssetEntry(asset).then((entry) => {
            if (version !== this.loadVersion) {
                return false;
            }

            this.attachPreparedEntry(entry);
            this.frameScene(entry.root);
            this.updatePointCloudSizes(true);
            this.ready = true;
            this.hideStatus();
            this.renderPending = true;
            pruneAssetCache();
            return true;
        });
    }

    captureViewState() {
        return {
            position: this.camera.position.clone(),
            quaternion: this.camera.quaternion.clone(),
            target: this.controls ? this.controls.target.clone() : this.boundingCenter.clone(),
            zoom: this.camera.zoom
        };
    }

    startSyncTransition(snapshot, duration = 260) {
        if (!snapshot || !this.ready || !this.controls) {
            return;
        }

        this.syncTween = {
            startedAt: window.performance.now(),
            duration,
            fromPosition: this.camera.position.clone(),
            toPosition: snapshot.position.clone(),
            fromQuaternion: this.camera.quaternion.clone(),
            toQuaternion: snapshot.quaternion.clone(),
            fromTarget: this.controls.target.clone(),
            toTarget: snapshot.target.clone(),
            fromZoom: this.camera.zoom,
            toZoom: snapshot.zoom
        };
        this.renderPending = true;
    }

    applySyncTween(now) {
        if (!this.syncTween || !this.controls) {
            return false;
        }

        const elapsed = now - this.syncTween.startedAt;
        const progress = Math.min(elapsed / this.syncTween.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        this.camera.position.lerpVectors(this.syncTween.fromPosition, this.syncTween.toPosition, eased);
        this.camera.quaternion.copy(this.syncTween.fromQuaternion).slerp(this.syncTween.toQuaternion, eased);
        this.controls.target.lerpVectors(this.syncTween.fromTarget, this.syncTween.toTarget, eased);
        this.camera.zoom = this.syncTween.fromZoom + (this.syncTween.toZoom - this.syncTween.fromZoom) * eased;
        this.camera.updateProjectionMatrix();
        this.renderPending = true;

        if (progress >= 1) {
            this.syncTween = null;
        }

        return true;
    }

    tick(now) {
        if (!this.controls) {
            return;
        }

        const isSyncing = this.applySyncTween(now);
        this.isApplyingSync = isSyncing;
        this.controls.update();
        this.isApplyingSync = false;
        if (this.updatePointCloudSizes()) {
            this.renderPending = true;
        }

        if (!this.renderPending) {
            return;
        }

        this.renderer.render(this.scene, this.camera);
        this.renderPending = false;
    }
}

function createSyncRegistry(viewers) {
    const groups = new Map();

    function ensureGroup(groupId) {
        if (!groupId) {
            return null;
        }

        if (!groups.has(groupId)) {
            groups.set(groupId, {
                viewers: [],
                timer: null,
                pendingSource: null,
                pendingState: null
            });
        }

        return groups.get(groupId);
    }

    function queueSync(sourceViewer) {
        const group = ensureGroup(sourceViewer.syncGroup);
        if (!group || !sourceViewer.ready) {
            return;
        }

        group.pendingSource = sourceViewer;
        group.pendingState = sourceViewer.captureViewState();

        if (group.timer !== null) {
            return;
        }

        group.timer = window.setTimeout(() => {
            const source = group.pendingSource;
            const snapshot = group.pendingState;

            group.timer = null;
            group.pendingSource = null;
            group.pendingState = null;

            if (!source || !snapshot) {
                return;
            }

            group.viewers.forEach((viewer) => {
                if (viewer === source) {
                    return;
                }
                viewer.startSyncTransition(snapshot, 260);
            });
        }, 100);
    }

    viewers.forEach((viewer) => {
        const group = ensureGroup(viewer.syncGroup);
        if (!group) {
            return;
        }

        group.viewers.push(viewer);
        viewer.controls.addEventListener('change', () => {
            if (!viewer.ready || viewer.isApplyingSync) {
                return;
            }
            queueSync(viewer);
        });
    });

    return {
        queueSync
    };
}

function setActiveSceneButton(buttons, activeId) {
    buttons.forEach((button) => {
        const isActive = button.dataset.demoScene === activeId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function updateSceneTitles(scene) {
    const sceneTitle = document.getElementById('demo-scene-title');
    const scenePair = document.getElementById('demo-scene-pair');

    if (sceneTitle) {
        sceneTitle.textContent = scene.title;
    }
    if (scenePair) {
        scenePair.textContent = `${scene.left.title} / ${scene.right.title} · ${scene.views} views`;
    }
}

function boot() {
    const roots = Array.from(document.querySelectorAll('[data-demo-webgl="viewer"]'));
    if (roots.length !== 2) {
        return;
    }

    try {
        const viewers = roots.map((root) => new DemoViewer(root));
        viewers.forEach((viewer) => {
            viewer.initialize();
        });

        let activeViewer = viewers[0];

        function setActiveViewer(nextViewer) {
            if (!nextViewer || nextViewer === activeViewer) {
                return;
            }

            viewers.forEach((viewer) => {
                viewer.setKeyboardActive(viewer === nextViewer);
            });
            activeViewer = nextViewer;
        }

        viewers.forEach((viewer) => {
            viewer.root.addEventListener('pointerenter', () => {
                setActiveViewer(viewer);
            });
            viewer.root.addEventListener('pointerdown', () => {
                setActiveViewer(viewer);
                viewer.root.focus({ preventScroll: true });
            });
            viewer.root.addEventListener('focus', () => {
                setActiveViewer(viewer);
            });
        });

        viewers.forEach((viewer, index) => {
            viewer.setKeyboardActive(index === 0);
        });

        const syncRegistry = createSyncRegistry(viewers);
        const buttons = Array.from(document.querySelectorAll('[data-demo-scene]'));

        function prefetchScene(sceneId) {
            const scene = SCENES.find((item) => item.id === sceneId);
            if (!scene) {
                return;
            }

            viewers[0].prefetchAsset(scene.left);
            viewers[1].prefetchAsset(scene.right);
        }

        async function showScene(sceneId) {
            const scene = SCENES.find((item) => item.id === sceneId) || SCENES[0];
            setActiveSceneButton(buttons, scene.id);
            updateSceneTitles(scene);

            const [leftViewer, rightViewer] = viewers;
            const results = await Promise.allSettled([
                leftViewer.loadAsset(scene.left),
                rightViewer.loadAsset(scene.right)
            ]);

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(result.reason);
                    viewers[index].setError('Failed to load 3D scene.');
                }
            });

            if (leftViewer.ready && rightViewer.ready) {
                window.setTimeout(() => {
                    syncRegistry.queueSync(leftViewer);
                }, 140);
            }
        }

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                showScene(button.dataset.demoScene);
            });
            button.addEventListener('pointerenter', () => {
                prefetchScene(button.dataset.demoScene);
            });
            button.addEventListener('focus', () => {
                prefetchScene(button.dataset.demoScene);
            });
        });

        showScene(DEFAULT_SCENE_ID);

        function animate(now) {
            viewers.forEach((viewer) => {
                viewer.tick(now);
            });
            window.requestAnimationFrame(animate);
        }

        animate(0);
    } catch (error) {
        console.error(error);
        roots.forEach((root) => {
            const status = root.querySelector('.demo-status') || root;
            status.textContent = '3D viewer dependencies failed to load.';
            status.classList.add('is-error');
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
