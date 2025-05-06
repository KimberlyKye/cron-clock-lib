import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as cronstrue from 'cronstrue';
import { format, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'cronstrue/locales/ru';

import * as cronParser from 'cron-parser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cron-alarm',
  templateUrl: './cron-alarm.component.html',
  styleUrls: ['./cron-alarm.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CronAlarmComponent implements OnInit {
  @Input() alarmName: string = '';
  @Input() cronExpression: string = '0 9 * * *'; // По умолчанию - ежедневно в 9:00
  @Output() cronChange = new EventEmitter<{ cron: string }>();
  @Output() saveAlarm = new EventEmitter<{ cron: string }>();

  // Поля формы
  minutes: string = '0';
  hours: string = '9';
  dayOfMonth: string = '*';
  month: string = '*';
  dayOfWeek: string = '*';
  preset: string = 'custom';
  humanReadable: string = '';

  // Опции
  presets = [
    { value: 'daily', label: 'Ежедневно', cron: '0 9 * * *' },
    { value: 'weekly', label: 'Еженедельно (понедельник)', cron: '0 9 * * 1' },
    { value: 'monthly', label: 'Ежемесячно (1 число)', cron: '0 9 1 * *' },
    { value: 'hourly', label: 'Каждый час', cron: '0 * * * *' },
    {
      value: 'custom',
      label: 'Не использовать шаблон (произвольное расписание)',
      cron: '',
    },
  ];

  daysOfWeek = [
    { value: '*', label: 'Любой день' },
    { value: '0', label: 'Воскресенье' },
    { value: '1', label: 'Понедельник' },
    { value: '2', label: 'Вторник' },
    { value: '3', label: 'Среда' },
    { value: '4', label: 'Четверг' },
    { value: '5', label: 'Пятница' },
    { value: '6', label: 'Суббота' },
  ];

  months = [
    { value: '*', label: 'Любой месяц' },
    { value: '1', label: 'Январь' },
    { value: '2', label: 'Февраль' },
    { value: '3', label: 'Март' },
    { value: '4', label: 'Апрель' },
    { value: '5', label: 'Май' },
    { value: '6', label: 'Июнь' },
    { value: '7', label: 'Июль' },
    { value: '8', label: 'Август' },
    { value: '9', label: 'Сентябрь' },
    { value: '10', label: 'Октябрь' },
    { value: '11', label: 'Ноябрь' },
    { value: '12', label: 'Декабрь' },
  ];

  nextAlarms: Date[] = [];
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.parseCronExpression();
    this.updateHumanReadable();
    this.calculateNextAlarms();
  }

  parseCronExpression(): void {
    if (!this.cronExpression) return;

    try {
      const parts = this.cronExpression.split(' ');
      if (parts.length >= 5) {
        this.minutes = parts[0];
        this.hours = parts[1];
        this.dayOfMonth = parts[2];
        this.month = parts[3];
        this.dayOfWeek = parts[4];

        // Проверяем, соответствует ли текущее выражение одному из пресетов
        const matchedPreset = this.presets.find(
          (p) => p.cron === this.cronExpression
        );
        this.preset = matchedPreset ? matchedPreset.value : 'custom';
      }
    } catch (err) {
      this.errorMessage = 'Ошибка разбора cron выражения';
      console.error(err);
    }
  }

  updateCronExpression(): void {
    this.errorMessage = null;

    if (this.preset !== 'custom') {
      const selectedPreset = this.presets.find((p) => p.value === this.preset);
      if (selectedPreset) {
        this.cronExpression = selectedPreset.cron;
        this.parseCronExpression();
      }
    } else {
      this.cronExpression = `${this.minutes} ${this.hours} ${this.dayOfMonth} ${this.month} ${this.dayOfWeek}`;
    }

    try {
      cronParser.CronExpressionParser.parse(this.cronExpression);
      this.updateHumanReadable();
      this.calculateNextAlarms();
      this.cronChange.emit({ cron: this.cronExpression });
    } catch (err) {
      this.errorMessage = 'Некорректное cron выражение';
      console.error(err);
    }
  }

  updateHumanReadable(): void {
    try {
      this.humanReadable = cronstrue.toString(this.cronExpression, {
        locale: 'ru',
      });
    } catch (err) {
      this.humanReadable = 'Не удалось преобразовать расписание';
      console.error(err);
    }
  }

  calculateNextAlarms(): void {
    this.nextAlarms = [];

    try {
      const interval = cronParser.CronExpressionParser.parse(
        this.cronExpression,
        {
          currentDate: new Date(),
        }
      );

      for (let i = 0; i < 5; i++) {
        const next = interval.next().toDate();
        if (next.getMilliseconds() > new Date().getMilliseconds()) {
          this.nextAlarms.push(next);
        }
      }
    } catch (err) {
      console.error('Error calculating next alarms:', err);
    }
  }

  formatDate(date: Date): string {
    return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
  }

  onSave(): void {
    this.updateCronExpression();
    if (!this.errorMessage) {
      this.saveAlarm.emit({ cron: this.cronExpression });
    }
  }
}
