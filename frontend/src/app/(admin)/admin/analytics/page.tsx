"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, LoadingState, MetricCard, PageIntro, Panel, StatusPill } from "@/components/ui/Workspace";

type Summary = {
  totals: { totalEmployees:number; presentToday:number; onLeaveToday:number; pendingLeaveRequests:number; workHoursThisMonth:number };
  headcount: Record<string,number>;
  todayAttendance: Array<{id:string;status:string;checkIn?:string;user:{name:string;department?:string}}>;
  recentHires: Array<{id:string;name:string;department?:string;jobTitle?:string;joiningDate:string}>;
  recentLeaveRequests: Array<{id:string;leaveType:string;status:string;startDate:string;user:{name:string}}>;
};
const date = (value:string) => new Date(value).toLocaleDateString(undefined,{day:"2-digit",month:"short"});

export default function AnalyticsPage() {
  const [data,setData]=useState<Summary|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{api.get("/analytics/summary").then(r=>setData(r.data.data)).catch(e=>setError(e.response?.data?.error||"Could not load dashboard"));},[]);
  if(error) return <EmptyState title="Dashboard unavailable" detail={error}/>;
  if(!data) return <LoadingState/>;
  const departments=Object.entries(data.headcount).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...departments.map(([,count])=>count));
  return <div>
    <PageIntro eyebrow="Admin workspace" title="Company overview" description="Live people, attendance, and leave activity from your Shiftly database."/>
    <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 xl:grid-cols-5">
      <MetricCard accent label="Employees" value={data.totals.totalEmployees} detail="Active accounts"/>
      <MetricCard label="Present today" value={data.totals.presentToday} detail="Checked in today"/>
      <MetricCard label="On leave" value={data.totals.onLeaveToday} detail="Approved today"/>
      <MetricCard label="Pending leave" value={data.totals.pendingLeaveRequests} detail="Awaiting review"/>
      <MetricCard label="Month hours" value={`${data.totals.workHoursThisMonth.toFixed(1)}h`} detail="Completed hours"/>
    </div>
    <div className="grid gap-px bg-white/10 lg:grid-cols-2">
      <Panel title="Departments" description="Live headcount">
        <div className="space-y-4 p-5">{departments.map(([name,count])=><div key={name}><div className="mb-2 flex justify-between text-sm"><span>{name}</span><span className="text-white/50">{count}</span></div><div className="h-2 bg-white/10"><div className="h-full bg-emerald-400" style={{width:`${count/max*100}%`}}/></div></div>)}</div>
      </Panel>
      <Panel title="Today" description="Attendance activity">
        {data.todayAttendance.length?<div className="divide-y divide-white/10 px-5">{data.todayAttendance.slice(0,8).map(a=><div key={a.id} className="flex items-center justify-between py-3"><div><p>{a.user.name}</p><p className="text-sm text-white/45">{a.user.department||"Team"}{a.checkIn?` / ${new Date(a.checkIn).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:""}</p></div><StatusPill status={a.status}/></div>)}</div>:<EmptyState title="No attendance yet" detail="Today's check-ins appear here."/>}
      </Panel>
      <Panel title="Recent hires" description="Newest team members">
        <div className="divide-y divide-white/10 px-5">{data.recentHires.map(h=><div key={h.id} className="flex justify-between py-3"><div><p>{h.name}</p><p className="text-sm text-white/45">{h.jobTitle||"Team member"} / {h.department||"Unassigned"}</p></div><span className="text-sm text-white/45">{date(h.joiningDate)}</span></div>)}</div>
      </Panel>
      <Panel title="Leave activity" description="Recent requests">
        {data.recentLeaveRequests.length?<div className="divide-y divide-white/10 px-5">{data.recentLeaveRequests.map(r=><div key={r.id} className="flex items-center justify-between py-3"><div><p>{r.user.name}</p><p className="text-sm text-white/45">{r.leaveType} / {date(r.startDate)}</p></div><StatusPill status={r.status}/></div>)}</div>:<EmptyState title="No leave requests" detail="New requests appear here."/>}
      </Panel>
    </div>
  </div>;
}
