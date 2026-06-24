import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const modules = [
  {
    module_number: 1,
    title: "Conceptual Foundations and Entity-Relationship Modeling",
    description: "Introduction to database concepts, ER modeling, and system architectures.",
    questions: [
      {
        question_text: "Define the term 'Database' and elaborate on the characteristics and advantages of the database approach versus traditional file processing systems.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Describe the Three-Schema Architecture and explain the absolute necessity of Logical Data Independence and Physical Data Independence mappings between schema levels.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Define and theoretically differentiate various types of attributes (simple, composite, single-valued, multi-valued, derived) with appropriate diagrammatic examples.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Draw a comprehensive ER diagram for a specific enterprise scenario (e.g., COMPANY database, Employee system, or University registry), specifying entities, attributes, relationships, cardinality ratios, and structural participation constraints.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Illustrate the component modules of a Database Management System and explain their internal programmatic interactions using a structural diagram.",
        frequency: 3,
        exam_cycles: ["July 2024", "July 2025", "January 2026"]
      },
      {
        question_text: "Define specific database terminology: Entity, Schema, DDL, DML, Weak Entity, Cardinality, Value Sets, Degree of a Relationship, Participation Role.",
        frequency: 2,
        exam_cycles: ["July 2024", "January 2025"]
      },
      {
        question_text: "Discuss the various types of end-users interacting with a DBMS (naive users, sophisticated users, database administrators) and explain their distinct operational scopes and access privileges.",
        frequency: 1,
        exam_cycles: ["January 2026"]
      }
    ]
  },
  {
    module_number: 2,
    title: "Relational Architectures and Mathematical Operations",
    description: "Relational models, constraints, update operations, and relational algebra operations.",
    questions: [
      {
        question_text: "Formulate exact Relational Algebra expressions for provided multi-table relational schemas such as EMP/DEPT, Sailors/Boats/Reserves, or Student/Instructor. Chain unary and binary operations to answer given business queries.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Discuss core relational integrity constraints: Primary Key, Super Key, Candidate Key, Foreign Key, Entity Integrity, and Referential Integrity. Explain how violations are handled during insert, delete, and update operations.",
        frequency: 3,
        exam_cycles: ["January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Illustrate and explain foundational Relational Algebra operators: Unary operations (SELECT σ, PROJECT π) and Binary operations (UNION, INTERSECTION, DIFFERENCE, CARTESIAN PRODUCT ×) with formal notation and examples.",
        frequency: 3,
        exam_cycles: ["July 2024", "July 2025", "January 2026"]
      },
      {
        question_text: "Discuss the update operations (INSERT, DELETE, MODIFICATION) on relations and detail the constraint violation handling mechanisms, including cascading operations and rejection strategies.",
        frequency: 2,
        exam_cycles: ["July 2024", "January 2026"]
      },
      {
        question_text: "Summarize the step-by-step algorithmic procedure to convert a conceptual ER model into a strict Relational Database schema, covering regular entity types, weak entities, binary relationships, and many-to-many cross-reference tables.",
        frequency: 2,
        exam_cycles: ["July 2025", "January 2026"]
      },
      {
        question_text: "Discuss EQUIJOIN, NATURAL JOIN, and general THETA JOIN operations in Relational Algebra utilizing formal notation. Explain mathematical distinctions between them.",
        frequency: 2,
        exam_cycles: ["January 2025", "January 2026"]
      },
      {
        question_text: "Discuss the specific mathematical characteristics of relations that make them distinctly different from ordinary tabular structures and sequential files (ordering of tuples, ordering of values, NULLs, interpretation of tuple values).",
        frequency: 2,
        exam_cycles: ["July 2024", "July 2025"]
      },
      {
        question_text: "Explain any two programmatic operations that change the structural state of a relation within a relational database system.",
        frequency: 1,
        exam_cycles: ["January 2025"]
      },
      {
        question_text: "Discuss Relational Algebra execution incorporating aggregation functions (SUM, COUNT, AVG, MAX, MIN) and complex grouping variables.",
        frequency: 1,
        exam_cycles: ["January 2025"]
      },
      {
        question_text: "Outline the methodologies for specifying dynamic constraints within SQL Data Definition Language (DDL) logic, including CHECK constraints and domain specifications.",
        frequency: 1,
        exam_cycles: ["July 2025"]
      }
    ]
  },
  {
    module_number: 3,
    title: "Normalization Theory and SQL Data Definition",
    description: "Database normalization, functional dependencies, and SQL DDL.",
    questions: [
      {
        question_text: "Define the concept of Normalization and explain the exact architectural rules for First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF) with structural examples showing before/after states.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Discuss the informal design guidelines for relational schema design: ensuring clear attribute semantics, reducing NULL values, avoiding spurious tuples during natural joins, and avoiding update anomalies.",
        frequency: 3,
        exam_cycles: ["July 2024", "July 2025", "January 2026"]
      },
      {
        question_text: "Discuss the specific types of update, insertion, and deletion anomalies in SQL and explain why they are considered structurally detrimental to database integrity. Show examples of each anomaly type.",
        frequency: 3,
        exam_cycles: ["July 2024", "January 2025", "January 2026"]
      },
      {
        question_text: "Formulate SQL schema manipulation queries (SELECT with complex WHERE conditions, UPDATE with subqueries, DELETE with constraints) for provided multi-table relational schemas.",
        frequency: 2,
        exam_cycles: ["July 2025", "January 2026"]
      },
      {
        question_text: "Define Functional Dependencies. Construct mathematical minimal covers using algorithms and apply Armstrong's Inference Rules (Reflexivity, Augmentation, Transitivity, Decomposition, Union, Pseudotransitivity) to compute attribute closures.",
        frequency: 2,
        exam_cycles: ["January 2025", "July 2025"]
      },
      {
        question_text: "Evaluate a relational partition and mathematically prove whether the architectural division represents a lossless-join decomposition.",
        frequency: 1,
        exam_cycles: ["January 2025"]
      },
      {
        question_text: "What is a Multivalued Dependency? Explain the architectural prerequisites for Fourth Normal Form (4NF) and Fifth Normal Form (5NF) with suitable examples.",
        frequency: 1,
        exam_cycles: ["July 2025"]
      },
      {
        question_text: "Illustrate SQL data types and demonstrate the execution of substring pattern matching techniques using LIKE, SIMILAR TO, and regex patterns.",
        frequency: 1,
        exam_cycles: ["July 2024"]
      },
      {
        question_text: "Write the precise SQL query syntax for INSERT, UPDATE, and DELETE Data Manipulation Language (DML) operations with constraint-handling examples.",
        frequency: 1,
        exam_cycles: ["July 2024"]
      },
      {
        question_text: "Explain the types and distinct operational categories of JDBC drivers utilized for Java-to-database connectivity.",
        frequency: 1,
        exam_cycles: ["January 2025"]
      }
    ]
  },
  {
    module_number: 4,
    title: "Advanced Query Processing and Transaction State Dynamics",
    description: "Complex SQL queries, transactions, concurrency, and serialization.",
    questions: [
      {
        question_text: "Construct complex SQL data extraction queries requiring correlated nested subqueries, complex JOIN constraints (inner, outer, self joins), and aggregate functions with GROUP BY and HAVING clauses.",
        frequency: 3,
        exam_cycles: ["July 2024", "January 2025", "July 2025"]
      },
      {
        question_text: "Demonstrate the working mechanics and complete syntax of SQL Assertions and Event-Condition-Action (ECA) Triggers. Show how triggers enforce business logic automatically in response to table-level data changes.",
        frequency: 3,
        exam_cycles: ["January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Define transaction mechanics and comprehensively discuss the necessity of enforcing strict ACID properties: Atomicity, Consistency, Isolation, and Durability. Provide real-world failure scenarios for each.",
        frequency: 3,
        exam_cycles: ["July 2024", "January 2025", "January 2026"]
      },
      {
        question_text: "Explain the types of systemic anomalies that emerge when transactions execute concurrently without strict control: Lost Update Problem, Dirty Read / Temporary Update Problem, Incorrect Summary Problem, and Unrepeatable Read.",
        frequency: 3,
        exam_cycles: ["July 2024", "January 2026", "July 2025"]
      },
      {
        question_text: "Explain cursor declaration, extraction logic (OPEN, FETCH, CLOSE), and processing properties within the context of Embedded SQL execution. Discuss how cursors resolve the impedance mismatch between SQL and host languages.",
        frequency: 2,
        exam_cycles: ["January 2025", "January 2026"]
      },
      {
        question_text: "Evaluate an interleaved concurrency schedule to determine Conflict Serializability or View Serializability mathematically. Use precedence (serialization) graphs to detect cycles.",
        frequency: 2,
        exam_cycles: ["January 2025", "July 2025"]
      },
      {
        question_text: "Detail the state transition diagram of a transaction showing all possible programmatic states (Active, Partially Committed, Committed, Failed, Aborted) and all lifecycle transition pathways between them.",
        frequency: 2,
        exam_cycles: ["January 2025", "January 2026"]
      },
      {
        question_text: "Syntactically differentiate between the WHERE and HAVING clauses in SQL. Explain their proper positioning relative to GROUP BY and their distinct roles in pre-aggregation versus post-aggregation filtering.",
        frequency: 2,
        exam_cycles: ["July 2024", "January 2026"]
      },
      {
        question_text: "Explain the operational mechanics of correlated nested queries in SQL with a syntactically correct practical example. Trace the iterative execution flow between the inner and outer query blocks.",
        frequency: 1,
        exam_cycles: ["July 2024"]
      },
      {
        question_text: "Define SQL Virtual Views and explain their operational mechanics, extraction usage patterns, and structural update limitations (non-updatable view conditions).",
        frequency: 1,
        exam_cycles: ["July 2024"]
      }
    ]
  },
  {
    module_number: 5,
    title: "Concurrency Control Protocols and Modern NoSQL Paradigms",
    description: "Locking protocols, deadlock handling, NoSQL databases, CAP theorem.",
    questions: [
      {
        question_text: "Describe the Two-Phase Locking (2PL) protocol in detail — growing phase and shrinking phase. Logically prove how its implementation guarantees transaction serializability. Discuss Strict 2PL and Conservative 2PL variants.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Detail the core structural data model of MongoDB and execute fundamental CRUD operations: Create (insertOne/insertMany), Read (find/findOne with filters), Update (updateOne with $set), and Delete (deleteOne/deleteMany). Explain JSON/BSON document structure.",
        frequency: 4,
        exam_cycles: ["July 2024", "January 2025", "July 2025", "January 2026"]
      },
      {
        question_text: "Explain the characteristics, major operational categories, and systemic architectures of generalized NoSQL distributed systems: Document stores, Key-Value stores, Column-family stores, and Graph databases.",
        frequency: 3,
        exam_cycles: ["July 2024", "July 2025", "January 2026"]
      },
      {
        question_text: "Discuss graph database architectures and explain the specific node-edge property data model inherent to Neo4j. Describe its query interface (Cypher), relationship traversal mechanics, and distributed system advantages over relational foreign keys.",
        frequency: 3,
        exam_cycles: ["July 2024", "January 2025", "January 2026"]
      },
      {
        question_text: "Describe the Wait-Die and Wound-Wait timestamp-based protocols implemented for systemic deadlock prevention in concurrent database systems. Compare preemptive vs non-preemptive behaviour and how timestamps dictate transaction survival priority.",
        frequency: 2,
        exam_cycles: ["July 2024", "January 2025"]
      },
      {
        question_text: "Explain Multiple Granularity Locking mechanisms and articulate the operational semantics and hierarchical levels of Intension Locks (IS, IX, SIX modes). Explain how higher-level intension locks optimize conflict detection at tuple level.",
        frequency: 2,
        exam_cycles: ["July 2024", "January 2026"]
      },
      {
        question_text: "Analyze the CAP Theorem and explain its foundational implications for distributed database engineering. Discuss the trilemma between Consistency, Availability, and Partition Tolerance, and how NoSQL systems make engineering trade-offs.",
        frequency: 1,
        exam_cycles: ["January 2025"]
      },
      {
        question_text: "Explain standard Binary Locks and Shared/Exclusive (S/X) locking protocols alongside their core operational lock acquisition and release algorithms.",
        frequency: 1,
        exam_cycles: ["July 2025"]
      },
      {
        question_text: "Discuss Multiversion Concurrency Control (MVCC) techniques and their mathematical approach to timestamp ordering and conflict resolution. Explain how MVCC satisfies read requests without blocking write operations.",
        frequency: 1,
        exam_cycles: ["January 2026"]
      }
    ]
  }
];

async function seedDBMS() {
  console.log('Seeding DBMS Questions...');

  // 1. Global count check
  const { data: existing, error: countError } = await supabase
    .from('questions')
    .select('id')
    .eq('subject_id', 'dbms');

  if (countError) {
    console.error('Error checking existing records:', countError);
    return;
  }

  const EXPECTED_TOTAL = 46;
  if (existing && existing.length >= EXPECTED_TOTAL) {
    console.log(`Database already has ${existing.length} DBMS questions. Skipping seed.`);
    return;
  }

  let totalInserted = 0;

  for (const mod of modules) {
    // 2. Insert or fetch Module
    const { data: existingMod, error: modFetchErr } = await supabase
      .from('modules')
      .select('id')
      .eq('subject_id', 'dbms')
      .eq('module_number', mod.module_number)
      .maybeSingle();

    let moduleId;
    if (existingMod) {
      moduleId = existingMod.id;
    } else {
      const { data: newMod, error: modInsertErr } = await supabase
        .from('modules')
        .insert({
          subject_id: 'dbms',
          module_number: mod.module_number,
          title: mod.title,
          description: mod.description
        })
        .select('id')
        .single();
      
      if (modInsertErr || !newMod) {
        console.error(`Error inserting module ${mod.module_number}:`, modInsertErr);
        continue;
      }
      moduleId = newMod.id;
    }

    // 2.5 Check if module already has questions
    const { data: existingQs } = await supabase
      .from('questions')
      .select('id')
      .eq('module_id', moduleId);

    if (existingQs && existingQs.length > 0) {
      console.log(`Module ${mod.module_number} already has ${existingQs.length} questions. Skipping.`);
      continue;
    }

    // 3. Insert Questions for this module
    const questionsToInsert = mod.questions.map((q, index) => ({
      subject_id: 'dbms',
      module_id: moduleId,
      question_text: q.question_text,
      frequency: q.frequency,
      exam_cycles: q.exam_cycles,
      sort_order: index + 1
    }));

    const { data: insertedQs, error: qError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select('id');

    if (qError) {
      console.error(`Error inserting questions for module ${mod.module_number}:`, qError);
    } else {
      totalInserted += insertedQs?.length || 0;
      console.log(`✅ Module ${mod.module_number} seeded: ${insertedQs?.length} questions.`);
    }
  }

  console.log(`\n🎉 Success! A total of ${totalInserted} DBMS questions were inserted successfully.`);
}

seedDBMS();
