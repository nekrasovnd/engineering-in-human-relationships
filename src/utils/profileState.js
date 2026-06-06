import { hasComparableProfileData } from './compatibility';

export function hasCompletedQuestionnaire(profile) {
  return profile?.questionnaireCompleted === true;
}

export function isDiscoverVisible(profile) {
  return profile?.discoverVisible === true;
}

export function canUseDiscover(profile) {
  return (
    hasCompletedQuestionnaire(profile) &&
    isDiscoverVisible(profile) &&
    hasComparableProfileData(profile)
  );
}
