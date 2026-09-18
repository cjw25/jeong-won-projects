package com.plandoseediary.repository;

import com.plandoseediary.domain.FiveDayRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FiveDayRecordRepository
        extends JpaRepository<FiveDayRecord, Long> {

    List<FiveDayRecord> findByExperimentIdOrderByRecordDateAsc(
            Long experimentId
    );

    long countByExperimentId(
            Long experimentId
    );

    boolean existsByExperimentIdAndRecordDate(
            Long experimentId,
            LocalDate recordDate
    );
}