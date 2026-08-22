function toDirectoryUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl,
    department: user.department,
    jobTitle: user.jobTitle,
    loginId: user.loginId,
    role: user.role,
    joiningDate: user.joiningDate,
    manager: user.manager
      ? { id: user.manager.id, name: user.manager.name }
      : null,
  };
}

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function toUserProfile(user) {
  return {
    id: user.id,
    companyId: user.companyId,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    maritalStatus: user.maritalStatus,
    personalEmail: user.personalEmail,
    panCode: user.panCode,
    uanCode: user.uanCode,
    accountNumber: user.accountNumber,
    homeAddress: user.homeAddress,
    role: user.role,
    department: user.department,
    jobTitle: user.jobTitle,
    managerId: user.managerId,
    profilePictureUrl: user.profilePictureUrl,
    joiningDate: user.joiningDate,
    about: user.about,
    skills: toArray(user.skills),
    certifications: toArray(user.certifications),
    interests: toArray(user.interests),
    mustChangePassword: user.mustChangePassword,
  };
}

module.exports = {
  toDirectoryUser,
  toUserProfile,
};
