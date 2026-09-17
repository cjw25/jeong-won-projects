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

    public Map<String, Object> exportAll() {

        Map<String, Object> result = new LinkedHashMap<>();

        result.put(
                "plans",
                planRepository.findAll()
                        .stream()
                        .map(this::planToMap)
                        .toList()
        );

        result.put(
                "planRevisions",
                planRevisionRepository.findAll()
                        .stream()
                        .map(this::revisionToMap)
                        .toList()
        );

        result.put(
                "todos",
                todoRepository.findAll()
                        .stream()
                        .map(this::todoToMap)
                        .toList()
        );

        result.put(
                "executionRecords",
                executionRecordRepository.findAll()
                        .stream()
                        .map(this::executionToMap)
                        .toList()
        );

        result.put(
                "completionEvents",
                completionEventRepository.findAll()
                        .stream()
                        .map(this::completionToMap)
                        .toList()
        );

        result.put(
                "reviews",
                reviewRepository.findAll()
                        .stream()
                        .map(this::reviewToMap)
                        .toList()
        );

        return result;
    }

    private Map<String, Object> planToMap(Plan plan) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", plan.getId());
        map.put("title", plan.getTitle());
        map.put("startDate", plan.getStartDate());
        map.put("endDate", plan.getEndDate());
        map.put("priority", plan.getPriority());
        map.put("successCriteria", plan.getSuccessCriteria());
        map.put("estimatedMinutes", plan.getEstimatedMinutes());
        map.put("carriedNote", plan.getCarriedNote());
        map.put("createdAt", plan.getCreatedAt());
        map.put("updatedAt", plan.getUpdatedAt());

        return map;
    }

    private Map<String, Object> revisionToMap(PlanRevision revision) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", revision.getId());
        map.put("planId", revision.getPlan().getId());
        map.put("revisionNo", revision.getRevisionNo());
        map.put("title", revision.getTitle());
        map.put("startDate", revision.getStartDate());
        map.put("endDate", revision.getEndDate());
        map.put("priority", revision.getPriority());
        map.put("successCriteria", revision.getSuccessCriteria());
        map.put("estimatedMinutes", revision.getEstimatedMinutes());
        map.put("carriedNote", revision.getCarriedNote());
        map.put("recordedAt", revision.getRecordedAt());

        return map;
    }

    private Map<String, Object> todoToMap(Todo todo) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", todo.getId());
        map.put("planId", todo.getPlan().getId());
        map.put("content", todo.getContent());
        map.put("dueDate", todo.getDueDate());
        map.put("priority", todo.getPriority());
        map.put("tag", todo.getTag());
        map.put("estimatedMinutes", todo.getEstimatedMinutes());
        map.put("completed", todo.isCompleted());
        map.put("deleted", todo.isDeleted());
        map.put("createdAt", todo.getCreatedAt());
        map.put("updatedAt", todo.getUpdatedAt());

        return map;
    }

    private Map<String, Object> executionToMap(
            ExecutionRecord record
    ) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", record.getId());
        map.put("todoId", record.getTodo().getId());
        map.put("startedAt", record.getStartedAt());
        map.put("endedAt", record.getEndedAt());
        map.put("actualMinutes", record.getActualMinutes());
        map.put("blockedReason", record.getBlockedReason());
        map.put("createdAt", record.getCreatedAt());

        return map;
    }

    private Map<String, Object> completionToMap(
            CompletionEvent event
    ) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", event.getId());
        map.put("todoId", event.getTodo().getId());
        map.put("requestKey", event.getRequestKey());
        map.put("completedAt", event.getCompletedAt());
        map.put("createdAt", event.getCreatedAt());

        return map;
    }

    private Map<String, Object> reviewToMap(Review review) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", review.getId());
        map.put("planId", review.getPlan().getId());
        map.put("goodPoint", review.getGoodPoint());
        map.put("gapPoint", review.getGapPoint());
        map.put("nextImprovement", review.getNextImprovement());
        map.put("createdAt", review.getCreatedAt());
        map.put("updatedAt", review.getUpdatedAt());

        return map;
    }
}