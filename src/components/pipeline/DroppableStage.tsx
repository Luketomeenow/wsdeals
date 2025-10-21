import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DroppableStageProps {
  id: string;
  children: ReactNode;
  isOver?: boolean;
}

export function DroppableStage({ id, children, isOver }: DroppableStageProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver 
          ? 'bg-primary/5 border-primary/30 border-2 border-dashed rounded-lg' 
          : 'border-2 border-transparent'
      }`}
    >
      {children}
    </div>
  );
}