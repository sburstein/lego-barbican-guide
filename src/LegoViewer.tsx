import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildPhaseModel, HIGHLIGHT_MAT, type PieceInfo } from "./lego-geometry";

type Props = {
  buildId: string;
  phaseId: string;
  stepIndex: number;
  completedPhases: string[];
  onPieceSelect?: (info: PieceInfo | null) => void;
};

export default function LegoViewer({
  buildId,
  phaseId,
  stepIndex,
  completedPhases,
  onPieceSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const highlightedRef = useRef<THREE.Mesh | null>(null);
  const originalMatRef = useRef<THREE.Material | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current)
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(
        sceneRef.current.children,
        true
      );

      // Unhighlight previous
      if (highlightedRef.current && originalMatRef.current) {
        highlightedRef.current.material = originalMatRef.current;
        highlightedRef.current = null;
        originalMatRef.current = null;
      }

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const info = (hit as any).pieceInfo as PieceInfo | undefined;
        if (info) {
          // Highlight
          highlightedRef.current = hit;
          originalMatRef.current = hit.material as THREE.Material;
          hit.material = HIGHLIGHT_MAT;
          onPieceSelect?.(info);
          return;
        }
      }
      onPieceSelect?.(null);
    },
    [onPieceSelect]
  );

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f0);
    scene.fog = new THREE.Fog(0xf5f5f0, 80, 150);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 300);
    camera.position.set(30, 22, 35);
    camera.lookAt(0, 8, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 8, 0);
    controls.minDistance = 15;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.update();
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
    directionalLight.position.set(15, 25, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.3);
    fillLight.position.set(-10, 10, -5);
    scene.add(fillLight);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xeae8e3,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper (subtle)
    const grid = new THREE.GridHelper(40, 40, 0xddd8d0, 0xddd8d0);
    grid.position.y = -0.04;
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Click handler
    renderer.domElement.addEventListener("click", handleClick);

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setIsLoaded(true);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("click", handleClick);
      resizeObserver.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [handleClick]);

  // Update model when phase changes
  useEffect(() => {
    if (!sceneRef.current || !isLoaded) return;

    // Remove old model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    }

    // Build new model
    const model = buildPhaseModel(phaseId, completedPhases, buildId, stepIndex);
    sceneRef.current.add(model);
    modelRef.current = model;

    // Unhighlight
    if (highlightedRef.current && originalMatRef.current) {
      highlightedRef.current.material = originalMatRef.current;
      highlightedRef.current = null;
      originalMatRef.current = null;
    }
    onPieceSelect?.(null);
  }, [buildId, phaseId, stepIndex, completedPhases, isLoaded, onPieceSelect]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ minHeight: 400 }}
    />
  );
}
