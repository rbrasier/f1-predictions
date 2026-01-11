import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Item {
  id: number;
  name: string;
  image_url?: string | null;
}

interface SortableItemProps {
  item: Item;
  index: number;
}

const SortableItem = ({ item, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const positionLabels: { [key: number]: string } = {
    0: '1st',
    1: '2nd',
    2: '3rd'
  };

  const getPositionLabel = (idx: number) => {
    if (idx < 3) return positionLabels[idx];
    return `${idx + 1}th`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://via.placeholder.com/48/E10600/FFFFFF?text=F1';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border-2 border-gray-200 rounded-lg p-4 mb-2 cursor-move hover:border-f1-red transition-all ${
        isDragging ? 'shadow-lg z-50' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-f1-red min-w-[60px]">
            {getPositionLabel(index)}
          </span>

          {/* Driver Image (if available) */}
          {item.image_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}

          <span className="text-lg font-medium text-gray-900">{item.name}</span>
        </div>
        <div className="text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface ChampionshipOrderPickerProps {
  items: Item[];
  onChange: (orderedIds: number[]) => void;
  title: string;
}

export const ChampionshipOrderPicker = ({ items, onChange, title }: ChampionshipOrderPickerProps) => {
  const [orderedItems, setOrderedItems] = useState<Item[]>(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        onChange(newOrder.map(item => item.id));
        return newOrder;
      });
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop to reorder. Position matters - you earn 1 point for each correct position.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedItems.map((item, index) => (
              <SortableItem key={item.id} item={item} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
