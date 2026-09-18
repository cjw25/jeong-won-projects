package com.plandoseediary.service;

import com.plandoseediary.domain.FiveDayExperiment;
import com.plandoseediary.domain.FiveDayRecord;
import com.plandoseediary.domain.User;
import com.plandoseediary.dto.FiveDayExperimentForm;
import com.plandoseediary.dto.FiveDayRecordForm;
import com.plandoseediary.dto.FiveDayStats;
import com.plandoseediary.dto.RuleChangeForm;
import com.plandoseediary.repository.FiveDayExperimentRepository;
import com.plandoseediary.repository.FiveDayRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class FiveDayExperimentService {

    private static final ZoneId SEOUL_ZONE =
            ZoneId.of("Asia/Seoul");

    private final FiveDayExperimentRepository experimentRepository;
    private final FiveDayRecordRepository recordRepository;
    private final CurrentUserService currentUserService;


    public FiveDayExperimentForm createDefaultForm() {

        FiveDayExperimentForm form =
                new FiveDayExperimentForm();

        form.setQuestion(
                "계획 규칙을 바꾸면 하루 실제 집중 시간이 달라지는가?"
        );

        form.setMetricName(
                "하루 실제 집중 시간"
        );

        form.setUnit(
                "분"
        );

        form.setCalculationRule(
                "해당 날짜에 실제로 집중한 시간을 분 단위로 합산한다."
        );

        form.setOriginalPlanRule(
                "하루 시작 전에 오늘 할 일을 최대 3개까지 정한다."
        );

        form.setMissingValueRule(
                "해당 날짜의 기록을 작성하지 않은 경우 0으로 임의 보정하지 않고 미기록으로 둔다."
        );

        form.setDuplicateValueRule(
                "같은 날짜는 한 건만 허용하며, 같은 날짜를 다시 저장하려 하면 거절한다."
        );

        form.setOutlierRule(
                "값이 유난히 크거나 작아도 실제 기록이면 삭제하거나 임의 수정하지 않고 그대로 포함한다."
        );

        form.setRoundingRule(
                "합계는 정수 분 그대로 표시하고, 평균은 소수 첫째 자리에서 반올림해 정수 분으로 표시한다."
        );

        form.setWeekStart(
                "월요일"
        );

        return form;
    }


    public FiveDayExperiment create(
            FiveDayExperimentForm form
    ) {

        User currentUser =
                currentUserService.getCurrentUser();

        if (
                experimentRepository
                        .existsByUserUsername(
                                currentUser.getUsername()
                        )
        ) {

            throw new IllegalStateException(
                    "이미 5일 기록 설정이 만들어져 있습니다."
            );
        }


        FiveDayExperiment experiment =
                new FiveDayExperiment();

        experiment.setUser(currentUser);
        experiment.setQuestion(form.getQuestion().trim());
        experiment.setMetricName(form.getMetricName().trim());
        experiment.setUnit(form.getUnit().trim());

        experiment.setCalculationRule(
                form.getCalculationRule().trim()
        );

        experiment.setOriginalPlanRule(
                form.getOriginalPlanRule().trim()
        );

        experiment.setMissingValueRule(
                form.getMissingValueRule().trim()
        );

        experiment.setDuplicateValueRule(
                form.getDuplicateValueRule().trim()
        );

        experiment.setOutlierRule(
                form.getOutlierRule().trim()
        );

        experiment.setRoundingRule(
                form.getRoundingRule().trim()
        );

        experiment.setWeekStart(
                form.getWeekStart().trim()
        );


        return experimentRepository.save(
                experiment
        );
    }


    @Transactional(readOnly = true)
    public Optional<FiveDayExperiment> findCurrentOptional() {

        String username =
                currentUserService
                        .getCurrentUsername();

        return experimentRepository
                .findByUserUsername(
                        username
                );
    }


    @Transactional(readOnly = true)
    public FiveDayExperiment findCurrent() {

        return findCurrentOptional()
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "5일 기록 설정이 없습니다."
                        )
                );
    }


    @Transactional(readOnly = true)
    public List<FiveDayRecord> findCurrentRecords() {

        FiveDayExperiment experiment =
                findCurrent();

        return recordRepository
                .findByExperimentIdOrderByRecordDateAsc(
                        experiment.getId()
                );
    }


    @Transactional(readOnly = true)
    public long countCurrentRecords() {

        return findCurrentRecords()
                .size();
    }


    @Transactional(readOnly = true)
    public LocalDate today() {

        return LocalDate.now(
                SEOUL_ZONE
        );
    }


    @Transactional(readOnly = true)
    public boolean hasTodayRecord() {

        FiveDayExperiment experiment =
                findCurrent();

        return recordRepository
                .existsByExperimentIdAndRecordDate(
                        experiment.getId(),
                        today()
                );
    }


    @Transactional(readOnly = true)
    public boolean mustChangeRule() {

        FiveDayExperiment experiment =
                findCurrent();

        long count =
                recordRepository
                        .countByExperimentId(
                                experiment.getId()
                        );

        return count == 2
                && !experiment.isRuleChanged();
    }


    @Transactional(readOnly = true)
    public boolean canChangeRule() {

        return mustChangeRule();
    }


    @Transactional(readOnly = true)
    public boolean canRecordToday() {

        FiveDayExperiment experiment =
                findCurrent();

        long count =
                recordRepository
                        .countByExperimentId(
                                experiment.getId()
                        );

        if (count >= 5) {
            return false;
        }


        if (hasTodayRecord()) {
            return false;
        }


        return count != 2
                || experiment.isRuleChanged();
    }


    @Transactional(readOnly = true)
    public long nextDayNumber() {

        return countCurrentRecords()
                + 1;
    }


    /*
     * C132
     *
     * 전체 합계·평균과
     * 규칙 변경 전/후 합계·평균을
     * 모두 같은 metricValue 기준으로 계산한다.
     */
    @Transactional(readOnly = true)
    public FiveDayStats getStats() {

        List<FiveDayRecord> records =
                findCurrentRecords();


        long total =
                records.stream()
                        .mapToLong(
                                FiveDayRecord::getMetricValue
                        )
                        .sum();


        long average =
                roundAverage(
                        total,
                        records.size()
                );


        /*
         * 규칙 변경 전은
         * 정확히 DAY 1, DAY 2.
         */
        List<FiveDayRecord> before =
                records.stream()
                        .limit(2)
                        .toList();


        /*
         * 규칙 변경 후는
         * DAY 3 이후.
         */
        List<FiveDayRecord> after =
                records.stream()
                        .skip(2)
                        .toList();


        long beforeTotal =
                before.stream()
                        .mapToLong(
                                FiveDayRecord::getMetricValue
                        )
                        .sum();


        long afterTotal =
                after.stream()
                        .mapToLong(
                                FiveDayRecord::getMetricValue
                        )
                        .sum();


        return new FiveDayStats(
                total,
                average,

                beforeTotal,
                roundAverage(
                        beforeTotal,
                        before.size()
                ),
                before.size(),

                afterTotal,
                roundAverage(
                        afterTotal,
                        after.size()
                ),
                after.size()
        );
    }


    private long roundAverage(
            long total,
            int count
    ) {

        if (count == 0) {
            return 0;
        }

        /*
         * 소수 첫째 자리에서 반올림하여
         * 정수 분으로 표시.
         */
        return Math.round(
                (double) total / count
        );
    }


    public FiveDayRecord createRecord(
            FiveDayRecordForm form
    ) {

        FiveDayExperiment experiment =
                findCurrent();


        List<FiveDayRecord> records =
                recordRepository
                        .findByExperimentIdOrderByRecordDateAsc(
                                experiment.getId()
                        );


        int count =
                records.size();


        if (count >= 5) {

            throw new IllegalStateException(
                    "5일 기록이 이미 모두 완료되었습니다."
            );
        }


        LocalDate today =
                LocalDate.now(
                        SEOUL_ZONE
                );


        if (
                recordRepository
                        .existsByExperimentIdAndRecordDate(
                                experiment.getId(),
                                today
                        )
        ) {

            throw new IllegalStateException(
                    "오늘 기록은 이미 저장되어 있습니다."
            );
        }


        if (
                count == 2
                        && !experiment.isRuleChanged()
        ) {

            throw new IllegalStateException(
                    "3일차 기록 전에 계획 규칙을 먼저 변경해야 합니다."
            );
        }


        String appliedRule;


        if (count < 2) {

            appliedRule =
                    experiment.getOriginalPlanRule();

        } else {

            appliedRule =
                    experiment.getChangedPlanRule();
        }


        FiveDayRecord record =
                new FiveDayRecord();


        record.setExperiment(
                experiment
        );

        record.setRecordDate(
                today
        );

        record.setMetricValue(
                form.getMetricValue()
        );

        record.setNote(
                form.getNote() == null
                        ? null
                        : form.getNote().trim()
        );

        record.setAppliedPlanRule(
                appliedRule
        );


        return recordRepository.save(
                record
        );
    }


    public FiveDayExperiment changeRule(
            RuleChangeForm form
    ) {

        FiveDayExperiment experiment =
                findCurrent();


        List<FiveDayRecord> records =
                recordRepository
                        .findByExperimentIdOrderByRecordDateAsc(
                                experiment.getId()
                        );


        if (experiment.isRuleChanged()) {

            throw new IllegalStateException(
                    "계획 규칙은 한 번만 변경할 수 있습니다."
            );
        }


        if (records.size() != 2) {

            throw new IllegalStateException(
                    "계획 규칙은 2일차 기록 뒤, 3일차 기록 전에만 변경할 수 있습니다."
            );
        }


        String changedRule =
                form.getChangedPlanRule()
                        .trim();


        if (
                changedRule.equals(
                        experiment.getOriginalPlanRule()
                )
        ) {

            throw new IllegalArgumentException(
                    "변경 후 규칙은 최초 규칙과 달라야 합니다."
            );
        }


        FiveDayRecord day1 =
                records.get(0);

        FiveDayRecord day2 =
                records.get(1);


        experiment.setChangedPlanRule(
                changedRule
        );

        experiment.setRuleChangeReason(
                form.getReason().trim()
        );

        experiment.setRuleChangedAt(
                LocalDateTime.now(
                        SEOUL_ZONE
                )
        );

        experiment.setRuleChangeAfterRecord1(
                day1
        );

        experiment.setRuleChangeAfterRecord2(
                day2
        );


        return experimentRepository.save(
                experiment
        );
    }
}