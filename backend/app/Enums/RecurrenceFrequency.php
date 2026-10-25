<?php

namespace App\Enums;

use Carbon\CarbonImmutable;

enum RecurrenceFrequency: string
{
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';
    case Monthly = 'monthly';
    case Yearly = 'yearly';

    public function nextDate(CarbonImmutable $current, CarbonImmutable $startsOn): CarbonImmutable
    {
        return match ($this) {
            self::Weekly => $current->addWeek(),
            self::Biweekly => $current->addWeeks(2),
            self::Monthly => tap($current->startOfMonth()->addMonth(), fn (CarbonImmutable $month) => null)
                ->day(min($startsOn->day, $current->startOfMonth()->addMonth()->daysInMonth)),
            self::Yearly => $current->addYearNoOverflow(),
        };
    }
}
