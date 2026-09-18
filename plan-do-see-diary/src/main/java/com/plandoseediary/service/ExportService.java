package com.plandoseediary.service;

import com.plandoseediary.domain.*;
import com.plandoseediary.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final PlanRepository planRepository;
    private final PlanRevisionRepository planRevisionRepository;
    private final TodoRepository todoRepository;
    private final ExecutionRecordRepository executionRecordRepository;
    private final CompletionEventRepository completionEventRepository;
    private final ReviewRepository reviewRepository;

    private final FiveDayExperimentRepository fiveDayExperimentRepository;
    private final FiveDayRecordRepository fiveDayRecordRepository;

    private final CurrentUserService currentUserService;


    public Map<String, Object> exportAll() {

        String username =
                currentUserService.getCurrentUsername();

        Map<String, Object> result =
                new LinkedHashMap<>();


        result.put(
                "plans",
                planRepository
                        .findAllByOwnerUsernameOrderByIdAsc(
                                username
                        )
                        .stream()
                        .map(this::planToMap)
                        .toList()
        );


        result.put(
                "planRevisions",
                planRevisionRepository
                        .findByPlanOwnerUsernameOrderByPlanIdAscRevisionNoAsc(
                                username
                        )
                        .stream()
                        .map(this::revisionToMap)
                        .toList()
        );


        result.put(
                "todos",
                todoRepository
                        .findByPlanOwnerUsernameOrderByIdAsc(
                                username
                        )
                        .stream()
                        .map(this::todoToMap)
                        .toList()
        );


        result.put(
                "executionRecords",
                executionRecordRepository
                        .findByTodoPlanOwnerUsernameOrderByStartedAtAsc(
                                username
                        )
                        .stream()
                        .map(this::executionToMap)
                        .toList()
        );


        result.put(
                "completionEvents",
                completionEventRepository
                        .findByTodoPlanOwnerUsernameOrderByCompletedAtAsc(
                                username
                        )
                        .stream()
                        .map(this::completionToMap)
                        .toList()
        );


        result.put(
                "reviews",
                reviewRepository
                        .findByPlanOwnerUsernameOrderByPlanIdAsc(
                                username
                        )
                        .stream()
                        .map(this::reviewToMap)
                        .toList()
        );


        fiveDayExperimentRepository
                .findByUserUsername(username)
                .ifPresentOrElse(
                        experiment -> {

                            result.put(
                                    "fiveDayExperiment",
                                    experimentToMap(
                                            experiment
                                    )
                            );

                            List<FiveDayRecord> records =
                                    fiveDayRecordRepository
                                            .findByExperimentIdOrderByRecordDateAsc(
                                                    experiment.getId()
                                            );

                            result.put(
                                    "fiveDayRecords",
                                    records.stream()
                                            .map(this::fiveDayRecordToMap)
                                            .toList()
                            );
                        },

                        () -> {

                            result.put(
                                    "fiveDayExperiment",
                                    null
                            );

                            result.put(
                                    "fiveDayRecords",
                                    List.of()
                            );
                        }
                );


        return result;
    }


    private Map<String, Object> planToMap(
            Plan plan
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", plan.getId());
        map.put("title", plan.getTitle());
        map.put("startDate", plan.getStartDate());
        map.put("endDate", plan.getEndDate());
        map.put("priority", plan.getPriority());
        map.put(
                "successCriteria",
                plan.getSuccessCriteria()
        );
        map.put(
                "estimatedMinutes",
                plan.getEstimatedMinutes()
        );
        map.put(
                "carriedNote",
                plan.getCarriedNote()
        );
        map.put(
                "createdAt",
                plan.getCreatedAt()
        );
        map.put(
                "updatedAt",
                plan.getUpdatedAt()
        );

        return map;
    }


    private Map<String, Object> revisionToMap(
            PlanRevision revision
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", revision.getId());
        map.put(
                "planId",
                revision.getPlan().getId()
        );
        map.put(
                "revisionNo",
                revision.getRevisionNo()
        );
        map.put("title", revision.getTitle());
        map.put(
                "startDate",
                revision.getStartDate()
        );
        map.put(
                "endDate",
                revision.getEndDate()
        );
        map.put(
                "priority",
                revision.getPriority()
        );
        map.put(
                "successCriteria",
                revision.getSuccessCriteria()
        );
        map.put(
                "estimatedMinutes",
                revision.getEstimatedMinutes()
        );
        map.put(
                "carriedNote",
                revision.getCarriedNote()
        );
        map.put(
                "recordedAt",
                revision.getRecordedAt()
        );

        return map;
    }


    private Map<String, Object> todoToMap(
            Todo todo
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", todo.getId());
        map.put(
                "planId",
                todo.getPlan().getId()
        );
        map.put(
                "content",
                todo.getContent()
        );
        map.put(
                "dueDate",
                todo.getDueDate()
        );
        map.put(
                "priority",
                todo.getPriority()
        );
        map.put(
                "tag",
                todo.getTag()
        );
        map.put(
                "estimatedMinutes",
                todo.getEstimatedMinutes()
        );
        map.put(
                "completed",
                todo.isCompleted()
        );
        map.put(
                "deleted",
                todo.isDeleted()
        );
        map.put(
                "createdAt",
                todo.getCreatedAt()
        );
        map.put(
                "updatedAt",
                todo.getUpdatedAt()
        );

        return map;
    }


    private Map<String, Object> executionToMap(
            ExecutionRecord record
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", record.getId());

        map.put(
                "todoId",
                record.getTodo().getId()
        );

        map.put(
                "startedAt",
                record.getStartedAt()
        );

        map.put(
                "endedAt",
                record.getEndedAt()
        );

        map.put(
                "actualMinutes",
                record.getActualMinutes()
        );

        map.put(
                "blockedReason",
                record.getBlockedReason()
        );

        map.put(
                "createdAt",
                record.getCreatedAt()
        );

        return map;
    }


    private Map<String, Object> completionToMap(
            CompletionEvent event
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", event.getId());

        map.put(
                "todoId",
                event.getTodo().getId()
        );

        /*
         * requestKey는 내부 중복방지 값이므로
         * Export에 포함하지 않는다.
         */

        map.put(
                "completedAt",
                event.getCompletedAt()
        );

        map.put(
                "createdAt",
                event.getCreatedAt()
        );

        return map;
    }


    private Map<String, Object> reviewToMap(
            Review review
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put("id", review.getId());

        map.put(
                "planId",
                review.getPlan().getId()
        );

        map.put(
                "goodPoint",
                review.getGoodPoint()
        );

        map.put(
                "gapPoint",
                review.getGapPoint()
        );

        map.put(
                "nextImprovement",
                review.getNextImprovement()
        );

        map.put(
                "createdAt",
                review.getCreatedAt()
        );

        map.put(
                "updatedAt",
                review.getUpdatedAt()
        );

        return map;
    }


    private Map<String, Object> experimentToMap(
            FiveDayExperiment experiment
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put(
                "id",
                experiment.getId()
        );

        map.put(
                "question",
                experiment.getQuestion()
        );

        map.put(
                "metricName",
                experiment.getMetricName()
        );

        map.put(
                "unit",
                experiment.getUnit()
        );

        map.put(
                "calculationRule",
                experiment.getCalculationRule()
        );

        map.put(
                "originalPlanRule",
                experiment.getOriginalPlanRule()
        );

        map.put(
                "changedPlanRule",
                experiment.getChangedPlanRule()
        );

        map.put(
                "ruleChangedAt",
                experiment.getRuleChangedAt()
        );

        map.put(
                "ruleChangeReason",
                experiment.getRuleChangeReason()
        );

        map.put(
                "ruleChangeAfterRecord1Id",
                experiment.getRuleChangeAfterRecord1() == null
                        ? null
                        : experiment
                        .getRuleChangeAfterRecord1()
                        .getId()
        );

        map.put(
                "ruleChangeAfterRecord2Id",
                experiment.getRuleChangeAfterRecord2() == null
                        ? null
                        : experiment
                        .getRuleChangeAfterRecord2()
                        .getId()
        );

        map.put(
                "missingValueRule",
                experiment.getMissingValueRule()
        );

        map.put(
                "duplicateValueRule",
                experiment.getDuplicateValueRule()
        );

        map.put(
                "outlierRule",
                experiment.getOutlierRule()
        );

        map.put(
                "roundingRule",
                experiment.getRoundingRule()
        );

        map.put(
                "weekStart",
                experiment.getWeekStart()
        );

        map.put(
                "createdAt",
                experiment.getCreatedAt()
        );

        return map;
    }


    private Map<String, Object> fiveDayRecordToMap(
            FiveDayRecord record
    ) {

        Map<String, Object> map =
                new LinkedHashMap<>();

        map.put(
                "id",
                record.getId()
        );

        map.put(
                "recordDate",
                record.getRecordDate()
        );

        map.put(
                "metricValue",
                record.getMetricValue()
        );

        map.put(
                "note",
                record.getNote()
        );

        map.put(
                "appliedPlanRule",
                record.getAppliedPlanRule()
        );

        map.put(
                "createdAt",
                record.getCreatedAt()
        );

        return map;
    }
}