import { reactive } from 'vue';

export interface ProFilterState {
  searchQuery: string;
  selectedDomain: string;
  selectedSkills: string[];
  maxAge: number;
  maxDistance: number;
  availableForInternship: boolean;
  onlyVerifiedStudents: boolean;
}

const filters = reactive<ProFilterState>({
  searchQuery: '',
  selectedDomain: 'it',
  selectedSkills: [],
  maxAge: 30,
  maxDistance: 50,
  availableForInternship: false,
  onlyVerifiedStudents: false
});

export function useProFilters() {
  function toggleSkill(skill: string) {
    const idx = filters.selectedSkills.indexOf(skill);
    if (idx > -1) {
      filters.selectedSkills.splice(idx, 1);
    } else {
      filters.selectedSkills.push(skill);
    }
  }

  function resetFilters() {
    filters.searchQuery = '';
    filters.selectedDomain = 'it';
    filters.selectedSkills = [];
    filters.maxAge = 30;
    filters.maxDistance = 50;
    filters.availableForInternship = false;
    filters.onlyVerifiedStudents = false;
  }

  return {
    filters,
    toggleSkill,
    resetFilters
  };
}