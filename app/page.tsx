import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-8">
      <Image
        src="/mascot-bee.svg"
        alt="Glint"
        width={180}
        height={150}
        priority
      />
    </main>
  );
}
