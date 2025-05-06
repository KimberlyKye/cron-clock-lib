import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CronAlarmComponent } from './cron/cron-alarm.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CronAlarmComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'cron-clock-lib';
  currentAlarmName = '';
  currentAlarmCron = '0 9 * * *';
  alarms: { name: string; cron: string }[] = [];

  onCronChange(event: { name: string; cron: string }) {
    this.currentAlarmName = event.name;
    this.currentAlarmCron = event.cron;
  }

  saveAlarm(event: { name: string; cron: string }) {
    if (!event.name) {
      alert('Введите название будильника');
      return;
    }

    const existingIndex = this.alarms.findIndex((a) => a.name === event.name);
    if (existingIndex >= 0) {
      this.alarms[existingIndex] = { ...event };
    } else {
      this.alarms.push({ ...event });
    }

    // Сброс формы
    this.currentAlarmName = '';
    this.currentAlarmCron = '0 9 * * *';
  }

  editAlarm(alarm: { name: string; cron: string }) {
    this.currentAlarmName = alarm.name;
    this.currentAlarmCron = alarm.cron;
  }
}
