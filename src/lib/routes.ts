export const ADMIN_ROUTES = {
  home: "/admin",
  login: "/admin/login",
  setupAccount: "/admin/crear-cuenta",
  recoverPassword: "/admin/recuperar",
  account: "/admin/cuenta",
  event: "/admin/evento",
  gifts: "/admin/regalos",
  newGift: "/admin/regalos/nuevo",
  editGift: (id: string) => `/admin/regalos/${id}`,
  invitations: "/admin/invitaciones",
  newInvitation: "/admin/invitaciones/nueva",
  editInvitation: (id: string) => `/admin/invitaciones/${id}`,
  confirmations: "/admin/confirmaciones",
  contributions: "/admin/aportes",
} as const;

export const GUEST_ROUTES = {
  invitation: (token: string) => `/i/${token}`,
  gifts: (token: string) => `/i/${token}/regalos`,
} as const;
