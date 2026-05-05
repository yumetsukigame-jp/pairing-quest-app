import { Suspense } from "react";
import HomePage from "./HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <HomePage />
    </Suspense>
  );
}
