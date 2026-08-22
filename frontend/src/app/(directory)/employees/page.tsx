"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { YuIcon } from "@/components/ui/YuIcons";

const Sparklines = {
  up1: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 25 L15 28 L30 18 L45 22 L60 8 L82 2 L82 34 Z" fill="url(#g1)" />
      <path d="M0 25 L15 28 L30 18 L45 22 L60 8 L82 2" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const mockTableData = [
  { id: "1", sel: false, name: "Emma Johansson", dept: "Engineering", email: "emma@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "Jacob Müller", role: "Developer", type: "FT", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 08, 2023" },
  { id: "2", sel: false, name: "Ethan Wilson", dept: "Sales", email: "ethan@shiftly.local", status: "ON LEAVE", statusBg: "--amber-50", statusTx: "--amber-700", mgr: "Olivia Davis", role: "AE", type: "FT", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 07, 2023" },
  { id: "3", sel: false, name: "Isabella Hernandez", dept: "Design", email: "isabella@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "Liam Johnson", role: "Designer", type: "PT", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 06, 2023" },
  { id: "4", sel: true, name: "William Lee", dept: "Product", email: "w.lee@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "James Smith", role: "PM", type: "FT", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 05, 2023" },
  { id: "5", sel: false, name: "Sophia Martinez", dept: "Support", email: "sophia@shiftly.local", status: "INACTIVE", statusBg: "--red-50", statusTx: "--red-700", mgr: "Olivia Davis", role: "Agent", type: "FT", tier: { bg: "--red-50", tx: "--red-700" }, date: "Dec 04, 2023" },
  { id: "6", sel: false, name: "Ava Clark", dept: "HR", email: "ava@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "Noah Garcia", role: "Recruiter", type: "Contract", tier: { bg: "--amber-50", tx: "--amber-700" }, date: "Dec 03, 2023" },
  { id: "7", sel: true, name: "Lily Walker", dept: "Marketing", email: "walker@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "Zoe Lewis", role: "Marketer", type: "FT", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 02, 2023" },
  { id: "8", sel: true, name: "James Young", dept: "Finance", email: "j.young@shiftly.local", status: "ACTIVE", statusBg: "--green-50", statusTx: "--green-700", mgr: "Oliver Hall", role: "Analyst", type: "FT", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 02, 2023" }
];

export default function EmployeesPage() {
  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      <div className="kpi-scroll-container flex border-b border-[var(--border-default)]" style={{ height: "112px" }}>
        <div className="flex w-full min-w-[1160px]">
          <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Total Employees</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">151</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>12%</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">{Sparklines.up1}</div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Active Status</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">148</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>2%</span>
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">On Leave</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">3</span>
            </div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">New Hires</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">8</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-scroll-container flex border-b border-[var(--border-default)] relative" style={{ height: "55px" }}>
        <div className="flex items-center h-full min-w-[1160px] pl-[20px]">
          <div className="flex items-center h-full relative" style={{ padding: "0 14px 0 16.6px" }}>
            <span className="text-label-tab text-primary whitespace-nowrap">All Employees</span>
            <div className="w-[4.4px]" />
            <div className="flex items-center justify-center rounded-[7px] bg-field-on-canvas w-[37px] h-[26px]">
              <span className="text-label-score text-secondary">151</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 22.45px 0 24.8px" }}>Engineering</div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 21.5px 0 22.45px" }}>Sales</div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 25.45px 0 21.5px" }}>Marketing</div>
        </div>
      </div>

      <div className="flex items-center min-w-0" style={{ height: "93px", paddingTop: "29px", paddingBottom: "26px", paddingLeft: "18px", paddingRight: "18px" }}>
        <div className="flex items-center">
          <div className="flex items-center rounded-[10px] bg-field-on-canvas" style={{ width: "283px", height: "38px", paddingLeft: "9px" }}>
            <YuIcon name="search-md" width={16} height={16} className="text-icon-muted" />
            <span className="ml-[8px] text-body-regular text-tertiary">Search employees</span>
          </div>
          <div className="w-[22px]" />
          <YuIcon name="filter-funnel-01" width={16} height={16} className="text-icon-default mx-[21px] md:mx-0 md:mr-[42px]" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          <YuIcon name="list" width={16} height={16} className="text-icon-strong mr-[36px]" />
          <YuIcon name="grid-01" width={16} height={16} className="text-icon-default mr-[24px]" />
          <Link href="/admin/employees/new" className="flex items-center justify-center rounded-[10px] bg-primary text-on-primary whitespace-nowrap" style={{ width: "138px", height: "36px", padding: "0 12px", gap: "8px" }}>
            <YuIcon name="plus" width={16} height={16} />
            <span className="text-body-medium font-semibold">New Employee</span>
          </Link>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="w-full text-left table-fixed table-min-width" style={{ borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "66px" }} />
            <col style={{ width: "155px" }} />
            <col style={{ width: "149px" }} />
            <col />
            <col style={{ width: "130px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "95px" }} />
            <col style={{ width: "74px" }} />
            <col style={{ width: "125px" }} />
            <col style={{ width: "34px" }} />
          </colgroup>
          <thead>
            <tr style={{ height: "33px", borderBottom: "1px solid var(--border-default)" }}>
              <th scope="col" className="font-normal" style={{ paddingLeft: "19px", paddingRight: "0" }}>
                <div className="flex items-center justify-center rounded-[5px] bg-primary w-[18px] h-[18px]">
                  <div className="w-[10px] h-[2px] bg-[var(--text-on-primary)]" />
                </div>
              </th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Employee</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Department</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Email</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Status</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Manager</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Role</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Type</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Joined</th>
              <th scope="col" className="font-normal" style={{ paddingLeft: "0", paddingRight: "18px" }}></th>
            </tr>
          </thead>
          <tbody>
            {mockTableData.map((row, i) => (
              <tr key={i} className="group hover:bg-sidebar transition-colors" style={{ height: "61.5px", borderBottom: "1px solid var(--border-default)" }}>
                <td className="sticky-col-1" style={{ paddingLeft: "19px", paddingRight: "0" }}>
                  <div className={`flex items-center justify-center rounded-[5px] w-[18px] h-[18px] ${row.sel ? "bg-primary" : "bg-field"}`}>
                    {row.sel && <YuIcon name="check" width={12} height={12} className="text-on-primary" strokeWidth="3" />}
                  </div>
                </td>
                <td className="sticky-col-2 p-0 pr-2">
                  <Link href={`/employees/${row.id}`} className="text-body-medium text-primary truncate hover:underline block">{row.name}</Link>
                </td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.dept}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.email}</td>
                <td className="p-0">
                  <span className="inline-flex items-center justify-center rounded-[7px] border border-strong text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: `var(${row.statusTx})`, borderColor: `var(${row.statusTx})` }}>
                    {row.status}
                  </span>
                </td>
                <td className="p-0 text-body-medium text-primary truncate pr-2">{row.mgr}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.role}</td>
                <td className="p-0" style={{ paddingTop: "3px" }}>
                  <span className="inline-flex items-center justify-center rounded-[7px] text-label-score" style={{ height: "26px", padding: "4px 6px", backgroundColor: `var(${row.tier.bg})`, color: `var(${row.tier.tx})` }}>
                    {row.type}
                  </span>
                </td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.date}</td>
                <td className="p-0" style={{ paddingRight: "18px" }}>
                  <Link href={`/employees/${row.id}`} className="text-icon-muted hover:text-icon-strong">
                    <YuIcon name="dots-horizontal" width={16} height={16} className="float-right" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
