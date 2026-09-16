/*
  عالم تعليمي ثلاثي الأبعاد — الصفحة الرئيسية فقط.
  عشرة أجسام صلصالية صغيرة (نجمة، كتب، قلم، حقيبة، آلة حاسبة، مكعبات)
  تطفو ببطء وتميل مع حركة المؤشر/اللمس. لا شيء يدور بسرعة ولا يومض:
  المشهد خلفية مبهجة لا لعبة تسحب الانتباه من بطاقات الطالبات.

  لا يُستورَد هذا الملف إلا عبر React.lazy من HeroObject، فلا يدخل
  three/fiber/drei أي حزمة قبل أن تُقرَّر الحاجة إليه فعلًا.
  الألوان تُمرَّر من الخارج بعد قراءتها من رموز CSS نفسها.
*/
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type SceneColors = {
  star: string;
  book1: string;
  book2: string;
  book3: string;
  pencil: string;
  bag: string;
  device: string;
};

const CLAY = { roughness: 0.62, metalness: 0 };

function useStarGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? 1 : 0.46;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.13,
      bevelSize: 0.13,
      bevelSegments: 3,
      curveSegments: 5,
    });
    geometry.center();
    return geometry;
  }, []);
}

/** ميلان المجموعة كلها خلف المؤشر — مصدر إحساس العمق في المشهد. */
function ParallaxGroup({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    const targetY = pointer.x * 0.26;
    const targetX = -pointer.y * 0.16;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
  });

  return <group ref={group}>{children}</group>;
}

function ClayStar({ color }: { color: string }) {
  const geometry = useStarGeometry();
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // تمايل حول المحور الرأسي بدل دوران كامل: النجمة جسم مبثوق مسطّح،
    // ودورانها ٣٦٠° يجعلها تُرى من حرفها نصف الوقت فتبدو شريطًا معدنيًا.
    if (mesh.current) mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.5}>
      <mesh ref={mesh} geometry={geometry} position={[0, 1.55, 0]} scale={0.78} castShadow>
        <meshStandardMaterial color={color} {...CLAY} roughness={0.42} />
      </mesh>
    </Float>
  );
}

function BookStack({ colors }: { colors: SceneColors }) {
  const books = [
    { color: colors.book1, y: -0.95, rotation: 0.07, width: 2.4 },
    { color: colors.book2, y: -0.58, rotation: -0.11, width: 2.16 },
    { color: colors.book3, y: -0.21, rotation: 0.15, width: 1.92 },
  ];
  return (
    <group position={[0, -0.15, 0]}>
      {books.map((book) => (
        <RoundedBox
          key={book.y}
          args={[book.width, 0.32, 1.5]}
          radius={0.11}
          smoothness={3}
          position={[0, book.y, 0]}
          rotation={[0, book.rotation, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={book.color} {...CLAY} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Pencil({ color }: { color: string }) {
  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.7}>
      <group position={[-1.9, 0.5, 0.5]} rotation={[0, 0, 0.75]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.9, 12]} />
          <meshStandardMaterial color={color} {...CLAY} />
        </mesh>
        <mesh position={[0, -1.12, 0]} castShadow>
          <coneGeometry args={[0.16, 0.36, 12]} />
          <meshStandardMaterial color="#ffb877" {...CLAY} />
        </mesh>
        <mesh position={[0, 1.04, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.22, 12]} />
          <meshStandardMaterial color="#ff9db0" {...CLAY} />
        </mesh>
      </group>
    </Float>
  );
}

function SchoolBag({ color }: { color: string }) {
  return (
    <Float speed={1.2} rotationIntensity={0.16} floatIntensity={0.55}>
      <group position={[1.95, 0.3, 0.3]} rotation={[0, -0.4, 0]}>
        <RoundedBox args={[1.25, 1.2, 0.68]} radius={0.24} smoothness={3} castShadow>
          <meshStandardMaterial color={color} {...CLAY} />
        </RoundedBox>
        <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.28, 0.07, 8, 24, Math.PI]} />
          <meshStandardMaterial color={color} {...CLAY} roughness={0.75} />
        </mesh>
        <RoundedBox args={[0.7, 0.36, 0.1]} radius={0.08} smoothness={2} position={[0, -0.24, 0.36]}>
          <meshStandardMaterial color="#fff8f0" {...CLAY} />
        </RoundedBox>
      </group>
    </Float>
  );
}

function Calculator({ color }: { color: string }) {
  const buttons = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        x: -0.19 + (index % 3) * 0.19,
        y: -0.16 + Math.floor(index / 3) * 0.2,
      })),
    [],
  );

  return (
    <Float speed={1.05} rotationIntensity={0.14} floatIntensity={0.45}>
      <group position={[-1.55, -0.9, 1.0]} rotation={[-0.9, 0.3, 0.2]}>
        <RoundedBox args={[0.8, 1.05, 0.14]} radius={0.09} smoothness={3} castShadow>
          <meshStandardMaterial color={color} {...CLAY} />
        </RoundedBox>
        <RoundedBox args={[0.58, 0.24, 0.04]} radius={0.04} smoothness={2} position={[0, 0.32, 0.09]}>
          <meshStandardMaterial color="#fff8f0" {...CLAY} />
        </RoundedBox>
        {buttons.map((button, index) => (
          <mesh key={index} position={[button.x, button.y, 0.09]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 10]} />
            <meshStandardMaterial color="#fff8f0" {...CLAY} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Cubes({ colors }: { colors: SceneColors }) {
  const cubes = [
    { position: [1.6, -1.15, 1.1] as const, color: colors.book1, rotation: 0.4 },
    { position: [2.1, -1.3, 0.55] as const, color: colors.star, rotation: -0.25 },
    { position: [1.15, -1.35, 1.45] as const, color: colors.book2, rotation: 0.8 },
  ];
  return (
    <group>
      {cubes.map((cube) => (
        <Float key={cube.position.join()} speed={0.9} rotationIntensity={0.25} floatIntensity={0.35}>
          <RoundedBox
            args={[0.46, 0.46, 0.46]}
            radius={0.1}
            smoothness={3}
            position={cube.position as unknown as [number, number, number]}
            rotation={[0.2, cube.rotation, 0.1]}
            castShadow
          >
            <meshStandardMaterial color={cube.color} {...CLAY} />
          </RoundedBox>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene({ colors }: { colors: SceneColors }) {
  return (
    <Canvas
      // سقف dpr: على شاشة بكثافة 3x يتضاعف عدد البكسلات تسع مرات بلا
      // فائدة مرئية تُذكر في مشهد صلصالي ناعم.
      dpr={[1, 1.6]}
      shadows
      // الإطار محسوب لا مُخمَّن: التكوين يمتد ~٥ وحدات عرضًا، وبزاوية ٣٨°
      // يحتاج مسافة ≈٧.٨ ليدخل كاملًا داخل لوحة مربّعة بلا قصّ.
      camera={{ position: [0, 0.45, 7.9], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[2.6, 5, 3.4]}
        intensity={1.45}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight position={[-3.4, 1.6, -2]} intensity={0.32} color="#ffd9c2" />

      <ParallaxGroup>
        <ClayStar color={colors.star} />
        <BookStack colors={colors} />
        <Pencil color={colors.pencil} />
        <SchoolBag color={colors.bag} />
        <Calculator color={colors.device} />
        <Cubes colors={colors} />
      </ParallaxGroup>

      <ContactShadows position={[0, -1.62, 0]} opacity={0.3} scale={9} blur={2.8} far={3.4} />
    </Canvas>
  );
}
