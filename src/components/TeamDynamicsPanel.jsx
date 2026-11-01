import { hasComparableProfileData } from '../utils/compatibility';
import DynamicsComparison from './DynamicsComparison';
import PsychMapCard from './PsychMapCard';
import SectionCard from './SectionCard';

/** Вкладка «Динамика»: владелец и админы сравнивают команду, остальные видят только себя. */
export default function TeamDynamicsPanel({ members, currentUserId, canViewAll }) {
  if (canViewAll) {
    return (
      <DynamicsComparison
        title="Как команда реагирует на нагрузку"
        subtitle="Одно воздействие на всех: видно, кто раскачивается, кто гаснет и кому нужно больше времени, чтобы прийти в норму. Сравнение видят только владелец и администраторы."
        people={members}
      />
    );
  }

  const myProfile = members.find((item) => item.userId === currentUserId);

  return hasComparableProfileData(myProfile) ? (
    <PsychMapCard profile={myProfile} />
  ) : (
    <SectionCard title="Динамика">
      <p className="text-sm text-slate-400">Пройдите анкету, чтобы увидеть свою психокарту.</p>
    </SectionCard>
  );
}
