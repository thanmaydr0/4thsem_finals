export function getStudentName(): string | null {
  try {
    const p = localStorage.getItem('vtu_local_profile');
    return p ? JSON.parse(p).name : null;
  } catch(e) {
    return null;
  }
}
