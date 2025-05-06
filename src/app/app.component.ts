import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CronAlarmComponent } from './cron/cron-alarm.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CronAlarmComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'cron-clock-lib';
  currentAlarmName = '';
  currentAlarmCron = '0 9 * * *';
  alarms: { cron: string }[] = [];

  onCronChange(event: { cron: string }) {
    this.currentAlarmCron = event.cron;
  }

  saveAlarm(event: { cron: string }) {
    this.alarms.push({ ...event });

    // Сброс формы
    this.currentAlarmName = '';
    this.currentAlarmCron = '0 9 * * *';
  }

  editAlarm(alarm: { cron: string }) {
    this.currentAlarmCron = alarm.cron;
  }
}
