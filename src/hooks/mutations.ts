// PDA Sport — Mutations (Supabase)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clubsService, teamsService, coachesService, invitesService, membershipService, type ClubRole } from "@/services";
import { uploadClubLogo, deleteClubLogo } from "@/lib/storage";
import type { Club, Team, Coach } from "@/types";
import { uploadClubLogo, deleteClubLogo } from "@/lib/storage";
import type { Club, Team, Coach } from "@/types";

export function useCreateClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Club, "id" | "created_at" | "active_teams" | "active_athletes"> & { logoFile?: File | null }) => {
      const { logoFile, ...rest } = payload;
      const created = await clubsService.create({ ...rest, logo_url: undefined });
      if (logoFile) {
        const url = await uploadClubLogo(created.id, logoFile);
        await clubsService.update(created.id, { logo_url: url });
        created.logo_url = url;
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["myClubIds"] });
      qc.invalidateQueries({ queryKey: ["myMemberships"] });
    },
  });
}

export function useUpdateClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; patch: Partial<Club>; logoFile?: File | null; removeLogo?: boolean; currentLogoUrl?: string | null }) => {
      let logo_url = args.patch.logo_url;
      if (args.removeLogo && args.currentLogoUrl) {
        await deleteClubLogo(args.currentLogoUrl);
        logo_url = null as unknown as string | undefined;
      }
      if (args.logoFile) {
        logo_url = await uploadClubLogo(args.id, args.logoFile);
      }
      await clubsService.update(args.id, { ...args.patch, logo_url });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["club", v.id] });
    },
  });
}

export function useArchiveClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; current: boolean }) => clubsService.toggleArchive(args.id, args.current),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useDeleteClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clubsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["myClubIds"] });
      qc.invalidateQueries({ queryKey: ["myMemberships"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Team, "id" | "created_at" | "athletes_count">) => teamsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Team> }) => teamsService.update(args.id, args.patch),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["team", v.id] });
    },
  });
}

export function useArchiveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; current: boolean }) => teamsService.toggleArchive(args.id, args.current),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Coach, "id">) => coachesService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coaches"] }),
  });
}

/* ============ INVITES ============ */

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { club_id: string; role: ClubRole; email?: string | null; max_uses?: number; expires_in_days?: number }) =>
      invitesService.create(payload),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["clubInvites", v.club_id] }),
  });
}

export function useRevokeInvite(clubId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitesService.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubInvites", clubId] }),
  });
}

export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => invitesService.redeem(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myClubIds"] });
      qc.invalidateQueries({ queryKey: ["myMemberships"] });
      qc.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
}
