
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DashboardStat {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
}

interface Appointment {
  patient: string;
  doctor: string;
  department: string;
  time: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  readonly stats: DashboardStat[] = [
    {
      label: 'Total patients',
      value: '1,284',
      description: 'Registered patients',
      icon: '♙',
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: "Today's appointments",
      value: '48',
      description: '12 appointments remaining',
      icon: '▦',
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Available doctors',
      value: '18',
      description: 'Across 6 departments',
      icon: '✚',
      iconClass: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'AI voice calls',
      value: '326',
      description: 'Calls handled this month',
      icon: '◉',
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ];

  readonly appointments: Appointment[] = [
    {
      patient: 'Aarav Sharma',
      doctor: 'Dr. Priya Mehta',
      department: 'Cardiology',
      time: '09:30 AM',
      status: 'CONFIRMED',
    },
    {
      patient: 'Ananya Patil',
      doctor: 'Dr. Rahul Shah',
      department: 'Orthopedics',
      time: '10:00 AM',
      status: 'PENDING',
    },
    {
      patient: 'Rohan Deshmukh',
      doctor: 'Dr. Neha Joshi',
      department: 'Dermatology',
      time: '10:30 AM',
      status: 'CONFIRMED',
    },
    {
      patient: 'Isha Kulkarni',
      doctor: 'Dr. Amit Verma',
      department: 'Neurology',
      time: '11:00 AM',
      status: 'CANCELLED',
    },
  ];

  readonly activities = [
    {
      title: 'Appointment booked',
      description: 'A new appointment was requested through the voice assistant.',
      time: '10 minutes ago',
      icon: '📅',
    },
    {
      title: 'Patient registered',
      description: 'A new patient profile was created.',
      time: '35 minutes ago',
      icon: '👤',
    },
    {
      title: 'AI call completed',
      description: 'The voice assistant completed a patient enquiry.',
      time: '1 hour ago',
      icon: '🎙️',
    },
  ];
}
