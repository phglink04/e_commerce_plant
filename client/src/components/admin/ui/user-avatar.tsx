type UserAvatarProps = {
  name: string;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
};

const sizeMap = {
  sm: { wrap: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5" },
  md: { wrap: "h-10 w-10", text: "text-sm", dot: "h-3 w-3" },
  lg: { wrap: "h-14 w-14", text: "text-base", dot: "h-3.5 w-3.5" },
};

const colorPool = [
  "from-emerald-400 to-teal-600",
  "from-blue-400 to-indigo-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-600",
  "from-cyan-400 to-sky-600",
];

function getColor(name: string): string {
  const idx = name.charCodeAt(0) % colorPool.length;
  return colorPool[idx];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function UserAvatar({
  name,
  isActive,
  size = "md",
  showDot = true,
}: UserAvatarProps) {
  const { wrap, text, dot } = sizeMap[size];
  const gradient = getColor(name);
  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`${wrap} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white ${text}`}
      >
        {initials}
      </div>
      {showDot && isActive !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dot} rounded-full border-2 border-white ${
            isActive ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      )}
    </div>
  );
}
