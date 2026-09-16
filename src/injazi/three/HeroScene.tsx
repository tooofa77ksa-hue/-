/*
  مشهد البطل ثلاثي الأبعاد
  ------------------------------------------------------------------
  هذا هو الموضع الوحيد في المنصة الذي يستحق Three.js: نجمة الإنجاز
  تقف فوق كومة كتب صلصالية وتستدير مع حركة المؤشر، فيبدو الإنجاز جسمًا
  يمكن الدوران حوله لا صورة مطبوعة. أي عمق آخر في الواجهة يُنفَّذ بـ CSS.

  هذا الملف لا يُستورَد إلا عبر React.lazy من HeroObject، فلا تدخل
  three/fiber/drei حزمة الدخول ولا تُحمَّل على الهاتف أصلًا.

  الألوان تُمرَّر من الخارج بعد قراءتها من رموز CSS نفسها، حتى لا تنفصل
  عائلة الصلصال ثلاثية الأبعاد عن عائلة الرسوم المسطّحة.
*/
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type SceneColors = {
  star: string;
  book1: string;
  book2: string;
  book3: string;
};

/** نجمة خماسية مبثوقة بحواف مشطوفة — النسب نفسها المستخدمة في ClayObject. */
function useStarGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outer = 1;
    const inner = 0.46;
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.14,
      bevelSegments: 4,
      curveSegments: 6,
    });
    geometry.center();
    return geometry;
  }, []);
}

function ClayStar({ color }: { color: string }) {
  const geometry = useStarGeometry();
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    // ميلان لطيف يتبع المؤشر: يعطي إحساس الجسم دون أن يصبح لعبة دوران.
    const targetY = state.pointer.x * 0.5;
    const targetX = -state.pointer.y * 0.28;
    mesh.current.rotation.y += (targetY - mesh.current.rotation.y) * 0.06;
    mesh.current.rotation.x += (targetX - mesh.current.rotation.x) * 0.06;
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[0, 0.95, 0]} castShadow>
      <meshStandardMaterial color={color} roughness={0.52} metalness={0} />
    </mesh>
  );
}

function BookStack({ colors }: { colors: SceneColors }) {
  const books = [
    { color: colors.book1, y: -1.15, rotation: 0.06, width: 2.5 },
    { color: colors.book2, y: -0.78, rotation: -0.1, width: 2.25 },
    { color: colors.book3, y: -0.42, rotation: 0.14, width: 2 },
  ];

  return (
    <group>
      {books.map((book) => (
        <RoundedBox
          key={book.y}
          args={[book.width, 0.34, 1.6]}
          radius={0.12}
          smoothness={3}
          position={[0, book.y, 0]}
          rotation={[0, book.rotation, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={book.color} roughness={0.68} metalness={0} />
        </RoundedBox>
      ))}
    </group>
  );
}

export default function HeroScene({ colors }: { colors: SceneColors }) {
  return (
    <Canvas
      // سقف dpr يمنع الشاشات عالية الكثافة من مضاعفة تكلفة الرسم أربع مرات.
      dpr={[1, 1.6]}
      shadows
      camera={{ position: [0, 0.9, 5.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[2.5, 5, 3]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight position={[-3, 1.5, -2]} intensity={0.35} color="#ffd9c2" />

      <Float speed={1.1} rotationIntensity={0.16} floatIntensity={0.55}>
        <ClayStar color={colors.star} />
        <BookStack colors={colors} />
      </Float>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.32} scale={7} blur={2.6} far={3} />
    </Canvas>
  );
}
