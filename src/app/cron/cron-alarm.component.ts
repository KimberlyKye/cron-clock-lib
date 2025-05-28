import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as cronstrue from 'cronstrue';
import { format, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'cronstrue/locales/ru';

import * as cronParser from 'cron-parser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'cron-alarm',
  templateUrl: './cron-alarm.component.html',
  styleUrls: ['./cron-alarm.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CronAlarmComponent implements OnInit {
  @Input() alarmName: string = '';
  @Input() cronExpression: string = '0 9 * * 1-5'; // По умолчанию - рабочие дни в 9:00
  @Input() showSaveButton: boolean = true;
  @Output() cronChange = new EventEmitter<{ name: string; cron: string }>();
  @Output() saveAlarm = new EventEmitter<{ name: string; cron: string }>();

  // Поля формы
  preset: string = 'workdays';
  customMinutes: string = '0';
  customHours: string = '9';
  customDayOfMonth: string = '*';
  customMonth: string = '*';
  customDayOfWeek: string = '*';
  customWeekdayNumber: string = '1';
  customWeekdayMonth: string = '1';

  // Настройки дней недели
  selectedWeekdays: number[] = [1, 2, 3, 4, 5]; // По умолчанию рабочие дни
  selectedMonths: number[] = [];
  useSpecificWeekday: boolean = false;

  // Опции
  presets = [
    { value: 'daily', label: 'Ежедневно', cron: '0 9 * * *' },
    { value: 'workdays', label: 'Рабочие дни (Пн-Пт)', cron: '0 9 * * 1-5' },
    { value: 'weekly', label: 'Еженедельно (понедельник)', cron: '0 9 * * 1' },
    { value: 'monthly', label: 'Ежемесячно (1 число)', cron: '0 9 1 * *' },
    { value: 'hourly', label: 'Каждый час', cron: '0 * * * *' },
    { value: 'specific-weekday', label: 'Конкретный день месяца', cron: '' },
    { value: 'custom', label: 'Произвольное расписание', cron: '' },
  ];

  weekdays = [
    { value: 0, label: 'Воскресенье' },
    { value: 1, label: 'Понедельник' },
    { value: 2, label: 'Вторник' },
    { value: 3, label: 'Среда' },
    { value: 4, label: 'Четверг' },
    { value: 5, label: 'Пятница' },
    { value: 6, label: 'Суббота' },
  ];

  months = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ];

  weekdayNumbers = [
    { value: '1', label: 'Первый' },
    { value: '2', label: 'Второй' },
    { value: '3', label: 'Третий' },
    { value: '4', label: 'Четвертый' },
    { value: '5', label: 'Пятый' },
    { value: 'L', label: 'Последний' },
  ];

  nextAlarms: Date[] = [];
  errorMessage: string | null = null;
  humanReadable: string = '';

  ngOnInit(): void {
    this.parseCronExpression();
    this.updateHumanReadable();
    this.calculateNextAlarms();
  }

  parseCronExpression(): void {
    if (!this.cronExpression) return;

    try {
      // Проверяем, соответствует ли текущее выражение одному из пресетов
      const matchedPreset = this.presets.find(
        (p) => p.cron === this.cronExpression
      );
      this.preset = matchedPreset ? matchedPreset.value : 'custom';

      // Если это настройка по дням недели
      if (this.cronExpression.includes('#')) {
        this.preset = 'specific-weekday';
        const parts = this.cronExpression.split(' ');
        this.customDayOfWeek = parts[4].split('#')[0];
        this.customWeekdayNumber = parts[4].split('#')[1];
        this.customMonth = parts[3];
      } else if (this.preset === 'custom') {
        const parts = this.cronExpression.split(' ');
        if (parts.length >= 5) {
          this.customMinutes = parts[0];
          this.customHours = parts[1];
          this.customDayOfMonth = parts[2];
          this.customMonth = parts[3];
          this.customDayOfWeek = parts[4];
        }
      }
    } catch (err) {
      this.errorMessage = 'Ошибка разбора cron выражения';
      console.error(err);
    }
  }

  updateCronExpression(): void {
    this.errorMessage = null;

    try {
      if (this.preset !== 'custom' && this.preset !== 'specific-weekday') {
        const selectedPreset = this.presets.find(
          (p) => p.value === this.preset
        );
        if (selectedPreset) {
          this.cronExpression = selectedPreset.cron;
        }
      } else if (this.preset === 'specific-weekday') {
        // Формат для "первый понедельник января": 0 9 ? 1 1#1
        this.cronExpression = `${this.customMinutes} ${this.customHours} ? ${this.customMonth} ${this.customDayOfWeek}#${this.customWeekdayNumber}`;
      } else {
        // Произвольное расписание
        if (
          this.selectedWeekdays.length > 0 &&
          this.selectedWeekdays.length < 7
        ) {
          this.customDayOfWeek = this.selectedWeekdays.join(',');
        } else {
          this.customDayOfWeek = '*';
        }

        this.cronExpression = `${this.customMinutes} ${this.customHours} ${this.customDayOfMonth} ${this.customMonth} ${this.customDayOfWeek}`;
      }

      cronParser.CronExpressionParser.parse(this.cronExpression);
      this.updateHumanReadable();
      this.calculateNextAlarms();
      this.cronChange.emit({ name: this.alarmName, cron: this.cronExpression });
    } catch (err) {
      this.errorMessage = 'Некорректное cron выражение';
      console.error(err);
    }
  }

  toggleWeekday(day: number): void {
    const index = this.selectedWeekdays.indexOf(day);
    if (index === -1) {
      this.selectedWeekdays.push(day);
    } else {
      this.selectedWeekdays.splice(index, 1);
    }
    this.selectedWeekdays.sort();
    this.preset = 'custom';
    this.updateCronExpression();
  }

  toggleMonth(month: number): void {
    const index = this.selectedMonths.indexOf(month);
    if (index === -1) {
      this.selectedMonths.push(month);
    } else {
      this.selectedMonths.splice(index, 1);
    }
    this.selectedMonths.sort();
    this.customMonth =
      this.selectedMonths.length > 0 ? this.selectedMonths.join(',') : '*';
    this.preset = 'custom';
    this.updateCronExpression();
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
        const next = interval.next();
        this.nextAlarms.push(next.toDate());
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
      this.saveAlarm.emit({ name: this.alarmName, cron: this.cronExpression });
    }
  }

  isWeekdaySelected(day: number): boolean {
    return this.selectedWeekdays.includes(day);
  }

  isMonthSelected(month: number): boolean {
    return this.selectedMonths.includes(month);
  }
}
