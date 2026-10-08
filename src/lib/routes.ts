export const ADMIN_ROUTES = {
  home: "/admin",
  login: "/admin/login",
  event: "/admin/evento",
  gifts: "/admin/regalos",
  newGift: "/admin/regalos/nuevo",
  editGift: (id: string) => `/admin/regalos/${id}`,
  invitations: "/admin/invitaciones",
  newInvitation: "/admin/invitaciones/nueva",
  editInvitation: (id: string) => `/admin/invitaciones/${id}`,
} as const;
