/**
 * useVnAddress — Cascading Vietnam address dropdowns
 * Uses https://provinces.open-api.vn/api/
 *
 * Returns provinces, districts (filtered by province), wards (filtered by district)
 */

import { useCallback, useEffect, useState } from "react";

export type VnProvince = { code: number; name: string };
export type VnDistrict = { code: number; name: string };
export type VnWard = { code: number; name: string };

const API = "https://provinces.open-api.vn/api";

export function useVnAddress() {
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [districts, setDistricts] = useState<VnDistrict[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  /* ── Fetch provinces on mount ── */
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    fetch(`${API}/p/`)
      .then((r) => r.json())
      .then((data: VnProvince[]) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch districts by province code ── */
  const fetchDistricts = useCallback((provinceCode: number) => {
    setDistricts([]);
    setWards([]);
    if (!provinceCode) return;

    setLoadingDistricts(true);
    fetch(`${API}/p/${provinceCode}?depth=2`)
      .then((r) => r.json())
      .then((data: { districts: VnDistrict[] }) => {
        setDistricts(data.districts || []);
      })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, []);

  /* ── Fetch wards by district code ── */
  const fetchWards = useCallback((districtCode: number) => {
    setWards([]);
    if (!districtCode) return;

    setLoadingWards(true);
    fetch(`${API}/d/${districtCode}?depth=2`)
      .then((r) => r.json())
      .then((data: { wards: VnWard[] }) => {
        setWards(data.wards || []);
      })
      .catch(() => {})
      .finally(() => setLoadingWards(false));
  }, []);

  /* ── Find code by name (for edit mode) ── */
  const findProvinceCode = useCallback(
    (name: string) => provinces.find((p) => p.name === name)?.code ?? 0,
    [provinces],
  );

  const findDistrictCode = useCallback(
    (name: string) => districts.find((d) => d.name === name)?.code ?? 0,
    [districts],
  );

  return {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    fetchDistricts,
    fetchWards,
    findProvinceCode,
    findDistrictCode,
  };
}
