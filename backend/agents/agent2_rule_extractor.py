import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.models import Rule, RuleStatus
from agents.agent1_parser import GuidelineExtraction

async def run_agent2(db: AsyncSession, extraction: GuidelineExtraction, trial_id: str, source_guideline_id: int) -> int:
    query = select(Rule).where(
        Rule.trial_id == trial_id,
        Rule.biomarker == extraction.biomarker,
        Rule.status == RuleStatus.ACTIVE
    )
    result = await db.execute(query)
    old_rule = result.scalar_one_or_none()

    diff_summary = {}
    new_version = "1.0"
    if old_rule:
        diff_summary = {
            "old_threshold": old_rule.threshold,
            "new_threshold": extraction.new_value,
            "old_operator": old_rule.operator,
            "new_operator": extraction.operator
        }
        # parse version
        try:
            major, minor = old_rule.version.split('.')
        except:
            major, minor = 1, 0
            
        if old_rule.operator != extraction.operator:
            new_version = f"{int(major) + 1}.0"
        else:
            new_version = f"{major}.{int(minor) + 1}"
            
        old_rule.status = RuleStatus.SUPERSEDED
        db.add(old_rule)
    else:
        diff_summary = {"new_rule": True}
        
    new_rule = Rule(
        version=new_version,
        trial_id=trial_id,
        biomarker=extraction.biomarker,
        operator=extraction.operator,
        threshold=extraction.new_value,
        status=RuleStatus.ACTIVE,
        diff_summary=diff_summary,
        source_guideline_id=source_guideline_id
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    
    return new_rule.id
