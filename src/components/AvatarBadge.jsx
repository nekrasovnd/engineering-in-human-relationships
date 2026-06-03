const sizeMap = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-20 w-20 text-2xl',
};

export default function AvatarBadge({
  initials = 'HR',
  imageUrl = '',
  size = 'md',
}) {
  return (
    <div
      className={`flex ${sizeMap[size]} overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-sky-700 font-display font-bold text-white shadow-lg`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Аватар профиля"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {initials}
        </span>
      )}
    </div>
  );
}
